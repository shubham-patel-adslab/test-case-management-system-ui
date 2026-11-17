import { createContext, useContext } from 'react';

import type { AuthSessionType, AuthSignInFormType, PermissionCode, ResourceCode } from './auth.type';

export type AuthContextValue = {
    // Settled by AuthProvider before anything renders: the signed-in session, or null when signed out.
    session: AuthSessionType | null;
    signIn: (form: AuthSignInFormType) => Promise<void>;
    signOut: () => Promise<void>;
    // The only way the UI checks permissions (ui-requirements §2 rule 5) — UX only, the API enforces.
    can: (resource: ResourceCode, permission: PermissionCode) => boolean;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
    // useContext rather than React 19's use(): the PRD (Frontend Req §1) evaluates useContext by name.
    const value = useContext(AuthContext);

    if (!value) {
        throw new Error('useAuth must be used inside AuthProvider');
    }

    return value;
}
