// Mirrors the backend's RESOURCE_CODE / PERMISSION_CODE (features/authorization/authorization.constant.ts).
// Add a resource here when the backend starts permission-checking it.
export const RESOURCE_CODE = {
    USER: 'USER',
    PROJECT: 'PROJECT',
    // Scope, not a thing: acting on every project, not only those the user is a member of (ADMIN).
    ALL_PROJECTS: 'ALL_PROJECTS',
    TEST_CASE: 'TEST_CASE',
    TEST_SUITE: 'TEST_SUITE',
    TEST_EXECUTION: 'TEST_EXECUTION',
    // Assigning test cases (or a suite run) to someone else.
    TEST_ASSIGNMENT: 'TEST_ASSIGNMENT',
    DEFECT: 'DEFECT',
    // The dashboard (GET /analytics) — READ for every role.
    ANALYTICS: 'ANALYTICS',
} as const;

export const PERMISSION_CODE = {
    CREATE: 'CREATE',
    READ: 'READ',
    UPDATE: 'UPDATE',
    DELETE: 'DELETE',
} as const;

export const SIGN_IN_PATH = '/sign-in';
export const SET_PASSWORD_PATH = '/set-password';
// The invitation link carries its token in the URL fragment: /set-password#token=…
export const INVITATION_TOKEN_PARAM = 'token';
export const RETURN_TO_PARAM = 'returnTo';

export const AUTH_SESSION_QUERY_KEY = ['auth', 'session'] as const;

// Same rules as the backend's new-password schema. bcrypt ignores everything past 72 bytes, so a longer
// password would only look stronger than it is.
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_BYTES = 72;
