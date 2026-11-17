// UPPER_SNAKE_CASE on the wire, as the backend stores them (no mapping layer).
export const PROJECT_STATUSES = ['ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED'] as const;

export const PROJECT_NAME_MAX_LENGTH = 100;
export const PROJECT_VERSION_MAX_LENGTH = 20;
export const PROJECT_DESCRIPTION_MAX_LENGTH = 1000;
// Same limit as the backend's PROJECT_MEMBERS_MAX.
export const PROJECT_MEMBERS_MAX = 100;

// The member picker shows the first matches; typing narrows them down.
export const MEMBER_CANDIDATE_PAGE_SIZE = 20;
export const MEMBER_SEARCH_DEBOUNCE_MS = 300;
