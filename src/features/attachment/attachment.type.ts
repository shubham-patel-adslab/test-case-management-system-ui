import type { UserReferenceType } from '../user/user.type';

export type AttachmentType = {
    id: number;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    // The authorized download route (a full path, e.g. /api/projects/1/attachments/5).
    url: string;
    uploadedBy: UserReferenceType | null;
    createdAt: string;
};
