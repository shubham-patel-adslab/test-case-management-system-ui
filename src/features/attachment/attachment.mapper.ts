import type { AttachmentResponseDto } from './attachment.response.dto';
import type { AttachmentType } from './attachment.type';
import { toUserReference } from '../user/user.mapper';

export function toAttachment(dto: AttachmentResponseDto): AttachmentType {
    return {
        id: dto.id,
        fileName: dto.fileName,
        mimeType: dto.mimeType,
        sizeBytes: dto.sizeBytes,
        url: dto.url,
        uploadedBy: dto.uploadedBy && toUserReference(dto.uploadedBy),
        createdAt: dto.createdAt,
    };
}
