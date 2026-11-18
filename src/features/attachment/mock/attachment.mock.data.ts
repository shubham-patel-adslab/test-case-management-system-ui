import type { AttachmentResponseDto } from '../attachment.response.dto';
import { addMockAuditLog, executionMock } from '../../test-execution/mock/test-execution.mock.data';
import { compareMockText } from '../../../shared/mock/page.mock';
import { userMock } from '../../user/mock/user.mock.data';

// An attachment as the mock "database" holds it, with its content (kept in memory, lost on reload).
export type MockAttachment = {
    id: number;
    projectId: number;
    executionId: number;
    fileName: string;
    mimeType: string;
    content: Blob;
    uploadedById: string;
    createdAt: string;
};

const SEEDED_LOG = 'ERROR 2026-05-12T10:04:11Z Request failed with status 500\n  at checkout (cart.ts:42)\n';
const SEEDED_EVERY_NTH_FAILURE = 4;

export const attachmentMock: MockAttachment[] = [];

export function nextMockAttachmentId(): number {
    return attachmentMock.reduce((maxId, attachment) => Math.max(maxId, attachment.id), 0) + 1;
}

// Every fourth failed run already has a log attached by whoever ran it (with its audit entry), so run pages
// show some.
function seedAttachments(): void {
    executionMock
        .filter((execution) => execution.status === 'FAIL' && execution.executedById && execution.executedAt)
        .filter((_, index) => index % SEEDED_EVERY_NTH_FAILURE === 0)
        .forEach((execution) => {
            const attachment: MockAttachment = {
                id: nextMockAttachmentId(),
                projectId: execution.projectId,
                executionId: execution.id,
                fileName: 'console.log',
                mimeType: 'text/plain',
                content: new Blob([SEEDED_LOG], { type: 'text/plain' }),
                uploadedById: execution.executedById!,
                createdAt: execution.executedAt!,
            };

            attachmentMock.push(attachment);
            addMockAuditLog(execution.id, 'ATTACHMENT_ADDED', attachment.uploadedById, {
                attachmentIds: [attachment.id],
                fileNames: [attachment.fileName],
            }, attachment.createdAt);
        });
}

seedAttachments();

// By file name (case-insensitive), like the backend's execution details.
export function compareMockAttachments(a: MockAttachment, b: MockAttachment): number {
    return compareMockText(a.fileName, b.fileName) || a.id - b.id;
}

export function findMockAttachmentsOfExecution(executionId: number): MockAttachment[] {
    return attachmentMock.filter((attachment) => attachment.executionId === executionId).sort(compareMockAttachments);
}

export function toAttachmentResponse(attachment: MockAttachment): AttachmentResponseDto {
    const uploader = userMock.find((user) => user.id === attachment.uploadedById);

    return {
        id: attachment.id,
        fileName: attachment.fileName,
        mimeType: attachment.mimeType,
        sizeBytes: attachment.content.size,
        url: `${import.meta.env.VITE_TCMS_API_URL}/projects/${attachment.projectId}/attachments/${attachment.id}`,
        uploadedBy: uploader ? { id: uploader.id, firstName: uploader.firstName, lastName: uploader.lastName } : null,
        createdAt: attachment.createdAt,
    };
}
