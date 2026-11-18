// The backend's limits (ui-requirements §4.4). The browser checks them first; the server is authoritative.
export const ATTACHMENT_MAX_FILES = 5;
export const ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024;
// The multipart field the API reads the files from.
export const ATTACHMENT_FIELD_NAME = 'files';
// Checked by extension here; the API detects the real type from the content (a renamed .exe is rejected).
export const ATTACHMENT_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.pdf', '.txt', '.log', '.csv'] as const;
