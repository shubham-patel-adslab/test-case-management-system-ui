import { ATTACHMENT_FIELD_NAME } from './attachment.constant';
import type { AttachmentResponseDto } from './attachment.response.dto';
import { tcmsApiClient } from '../../app/tcms.api.client';

const PERCENT = 100;

// All-or-nothing upload to a recorded execution. Reports progress in percent while the body is sent.
export async function uploadAttachments(
    projectId: number,
    executionId: number,
    files: File[],
    onProgress: (percent: number) => void,
): Promise<AttachmentResponseDto[]> {
    const body = new FormData();

    files.forEach((file) => body.append(ATTACHMENT_FIELD_NAME, file));

    const response = await tcmsApiClient.post<AttachmentResponseDto[]>(
        `/projects/${projectId}/test-executions/${executionId}/attachments`,
        body,
        {
            // Overrides the client's JSON default, which would make axios serialize the FormData as JSON; the
            // browser then sets multipart/form-data with its boundary.
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: ({ progress }) => {
                if (progress !== undefined) {
                    onProgress(Math.round(progress * PERCENT));
                }
            },
        },
    );

    return response.data;
}

// The file behind an attachment's `url` — a full site path (/api/projects/…), so not joined to the API base
// URL. Through the API client, so a 401 signs out like any other request.
export async function getAttachmentFile(url: string): Promise<Blob> {
    const response = await tcmsApiClient.get<Blob>(url, { baseURL: '', responseType: 'blob' });

    return response.data;
}
