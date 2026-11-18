import type { UserReferenceResponseDto } from '../user/user.response.dto';

// OpenAPI AttachmentResponse — on execution details. `url` is the authorized download route, a full path
// (/api/projects/:projectId/attachments/:id), not relative to the API base URL.
export type AttachmentResponseDto = {
    id: number;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    url: string;
    // null once the user row is removed (the OpenAPI spec omits the null — ui-requirements §11 q. 11).
    uploadedBy: UserReferenceResponseDto | null;
    createdAt: string;
};
