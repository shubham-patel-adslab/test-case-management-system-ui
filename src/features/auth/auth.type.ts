import { z } from 'zod';

import type { authSetPasswordFormSchema, authSignInFormSchema } from './auth.schema';
import type { PERMISSION_CODE, RESOURCE_CODE } from './auth.constant';

export type ResourceCode = (typeof RESOURCE_CODE)[keyof typeof RESOURCE_CODE];
export type PermissionCode = (typeof PERMISSION_CODE)[keyof typeof PERMISSION_CODE];

export type AuthSignInFormType = z.infer<typeof authSignInFormSchema>;

export type AuthSetPasswordFormType = z.infer<typeof authSetPasswordFormSchema>;

export type AuthUserType = {
    id: string;
    firstName: string;
    lastName: string | null;
    email: string;
};

export type AuthRoleType = {
    code: string;
    name: string;
};

// The signed-in user's session as the UI holds it — in memory only.
export type AuthSessionType = {
    user: AuthUserType;
    role: AuthRoleType;
    permissions: Record<string, readonly string[]>;
};
