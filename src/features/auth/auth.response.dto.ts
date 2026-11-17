// GET /auth/me and POST /auth/sign-in — identity only.
export type AuthUserResponseDto = {
    id: string;
    firstName: string;
    lastName: string | null; // null when the user has no last name
    email: string;
};

export type AuthRoleResponseDto = {
    code: string;
    name: string;
};

// Resource code → permission codes, e.g. { "USER": ["CREATE", "READ"] }. A resource with no grant is absent.
export type AuthPermissionsResponseDto = Record<string, string[]>;

// GET /authorization/me — what the signed-in user may do.
export type AuthorizationContextResponseDto = {
    role: AuthRoleResponseDto;
    permissions: AuthPermissionsResponseDto;
};
