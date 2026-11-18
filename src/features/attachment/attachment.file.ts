import { ATTACHMENT_EXTENSIONS, ATTACHMENT_MAX_BYTES } from './attachment.constant';

const BYTES_PER_KB = 1024;
const BYTES_PER_MB = BYTES_PER_KB * BYTES_PER_KB;

export type AttachmentFileProblem = 'type' | 'size';

const allowedExtensions: readonly string[] = ATTACHMENT_EXTENSIONS;

function getExtension(fileName: string): string {
    const dotIndex = fileName.lastIndexOf('.');

    return dotIndex === -1 ? '' : fileName.slice(dotIndex).toLowerCase();
}

// The browser-side check before uploading: what the API would reject anyway, caught without sending it.
export function checkAttachmentFile(file: File): AttachmentFileProblem | undefined {
    if (!allowedExtensions.includes(getExtension(file.name))) {
        return 'type';
    }

    return file.size > ATTACHMENT_MAX_BYTES ? 'size' : undefined;
}

// "12 KB", "3.4 MB", "10 MB" (no trailing ".0").
export function formatFileSize(bytes: number): string {
    return bytes < BYTES_PER_MB ? `${Math.ceil(bytes / BYTES_PER_KB)} KB` : `${Number((bytes / BYTES_PER_MB).toFixed(1))} MB`;
}
