import { http, HttpResponse } from 'msw';

import { attachmentMock, compareMockAttachments, nextMockAttachmentId, toAttachmentResponse, type MockAttachment } from './attachment.mock.data';
import { ATTACHMENT_FIELD_NAME, ATTACHMENT_MAX_BYTES, ATTACHMENT_MAX_FILES } from '../attachment.constant';
import { getMockSessionUser, mockErrorResponse, withMockPermission } from '../../auth/mock/auth.mock.handler';
import { PERMISSION_CODE, RESOURCE_CODE } from '../../auth/auth.constant';
import { findMockProjectInScope } from '../../project/mock/project.mock.handler';
import { EXECUTION_PENDING } from '../../test-execution/test-execution.constant';
import { addMockAuditLog, executionMock } from '../../test-execution/mock/test-execution.mock.data';
import { mockValidationError } from '../../../shared/mock/page.mock';

const PROJECT_URL = `${import.meta.env.VITE_TCMS_API_URL}/projects/:projectId`;

// The backend's content check: binary types by their magic bytes, text types by extension plus valid UTF-8
// without NUL bytes. A renamed .exe, a binary .txt or a text .png is rejected.
const MAGIC_BYTES: { mimeType: string; bytes: number[] }[] = [
    { mimeType: 'image/png', bytes: [0x89, 0x50, 0x4e, 0x47] },
    { mimeType: 'image/jpeg', bytes: [0xff, 0xd8, 0xff] },
    { mimeType: 'image/gif', bytes: [0x47, 0x49, 0x46, 0x38] },
    { mimeType: 'application/pdf', bytes: [0x25, 0x50, 0x44, 0x46] },
];
const TEXT_TYPES: Record<string, string> = { '.txt': 'text/plain', '.log': 'text/plain', '.csv': 'text/csv' };
const strictUtf8 = new TextDecoder('utf-8', { fatal: true });

function detectMimeType(content: Uint8Array, fileName: string): string | undefined {
    const binary = MAGIC_BYTES.find(({ bytes }) => bytes.every((byte, index) => content[index] === byte));

    if (binary) {
        return binary.mimeType;
    }

    const textType = TEXT_TYPES[fileName.slice(fileName.lastIndexOf('.')).toLowerCase()];

    if (!textType || content.includes(0)) {
        return undefined;
    }

    try {
        strictUtf8.decode(content);

        return textType;
    } catch {
        return undefined;
    }
}

export const attachmentMockHandler = [
    // All-or-nothing, like the backend: 1–5 files, each ≤ 10 MB (413), allowed content (400 on files[i]); only
    // on a recorded execution (409 while pending); audit ATTACHMENT_ADDED.
    http.post(`${PROJECT_URL}/test-executions/:executionId/attachments`, withMockPermission(RESOURCE_CODE.TEST_EXECUTION, PERMISSION_CODE.UPDATE, async ({ params, request }) => {
        const projectId = Number(params.projectId);
        const execution = findMockProjectInScope(projectId, PERMISSION_CODE.UPDATE)
            ? executionMock.find((candidate) => candidate.id === Number(params.executionId) && candidate.projectId === projectId)
            : undefined;

        if (!execution) {
            return mockErrorResponse(404, 'NOT_FOUND', 'Test execution not found');
        }

        const files = (await request.formData()).getAll(ATTACHMENT_FIELD_NAME).filter((value) => value instanceof File);

        if (files.length === 0 || files.length > ATTACHMENT_MAX_FILES) {
            return mockValidationError([{ field: ATTACHMENT_FIELD_NAME, message: `Send 1–${ATTACHMENT_MAX_FILES} files in the "files" field only` }]);
        }

        if (files.some((file) => file.size > ATTACHMENT_MAX_BYTES)) {
            return mockErrorResponse(413, 'PAYLOAD_TOO_LARGE', 'A file is larger than 10 MB', ATTACHMENT_FIELD_NAME);
        }

        if (execution.status === EXECUTION_PENDING) {
            return mockErrorResponse(409, 'CONFLICT', 'Attachments can be added once the result is recorded');
        }

        const contents = await Promise.all(files.map(async (file) => new Uint8Array(await file.arrayBuffer())));
        const mimeTypes = files.map((file, index) => detectMimeType(contents[index], file.name));
        const details = mimeTypes.flatMap((mimeType, index) => (mimeType
            ? []
            : [{ field: `${ATTACHMENT_FIELD_NAME}[${index}]`, message: 'Unsupported file type: allowed are PNG, JPEG, GIF, PDF and text (.txt, .log, .csv)' }]));

        if (details.length > 0) {
            return mockValidationError(details);
        }

        const user = getMockSessionUser()!;
        const now = new Date().toISOString();
        const created: MockAttachment[] = files.map((file, index) => ({
            id: nextMockAttachmentId() + index,
            projectId,
            executionId: execution.id,
            fileName: file.name,
            mimeType: mimeTypes[index]!,
            content: new Blob([contents[index]], { type: mimeTypes[index] }),
            uploadedById: user.id,
            createdAt: now,
        }));

        attachmentMock.push(...created);
        addMockAuditLog(execution.id, 'ATTACHMENT_ADDED', user.id, {
            attachmentIds: created.map((attachment) => attachment.id),
            fileNames: created.map((attachment) => attachment.fileName),
        }, now);

        // The new attachments by file name, like the backend.
        return HttpResponse.json([...created].sort(compareMockAttachments).map(toAttachmentResponse), { status: 201 });
    })),

    // Always a download, with the type detected at upload.
    http.get(`${PROJECT_URL}/attachments/:attachmentId`, withMockPermission(RESOURCE_CODE.TEST_EXECUTION, PERMISSION_CODE.READ, ({ params }) => {
        const projectId = Number(params.projectId);
        const attachment = findMockProjectInScope(projectId, PERMISSION_CODE.READ)
            ? attachmentMock.find((candidate) => candidate.id === Number(params.attachmentId) && candidate.projectId === projectId)
            : undefined;

        if (!attachment) {
            return mockErrorResponse(404, 'NOT_FOUND', 'Attachment not found');
        }

        return new HttpResponse(attachment.content, {
            headers: {
                'Content-Type': attachment.mimeType,
                'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(attachment.fileName)}`,
            },
        });
    })),
];
