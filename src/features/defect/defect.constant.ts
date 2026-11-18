// UPPER_SNAKE_CASE on the wire, as the backend stores them.
export const DEFECT_SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

// Same limits as the backend's defect schema.
export const DEFECT_TITLE_MAX_LENGTH = 255;
export const DEFECT_DESCRIPTION_MAX_LENGTH = 5000;
