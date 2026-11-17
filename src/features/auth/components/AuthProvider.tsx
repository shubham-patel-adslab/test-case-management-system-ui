import { useEffect } from 'react';
import { queryOptions, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { App } from 'antd';

import { AuthContext } from '../auth.context';
import { AUTH_SESSION_QUERY_KEY } from '../auth.constant';
import { getAuthorizationContext, getCurrentUser, signIn as signInRequest, signOut as signOutRequest } from '../auth.api';
import { toAuthSession, toAuthSignInRequestDto } from '../auth.mapper';
import type { AuthSessionType, AuthSignInFormType, PermissionCode, ResourceCode } from '../auth.type';
import { isUnauthorizedError } from '../../../app/api-error';
import { setUnauthorizedHandler } from '../../../app/tcms.api.client';
import { QueryErrorState } from '../../../shared/components/QueryErrorState';
import { QueryLoadingState } from '../../../shared/components/QueryLoadingState';

// Identity first, then role + permissions (backend contract). A 401 means "signed out", not an error.
async function fetchAuthSession(signal?: AbortSignal): Promise<AuthSessionType | null> {
    try {
        const user = await getCurrentUser(signal);
        const authorization = await getAuthorizationContext(signal);

        return toAuthSession(user, authorization);
    } catch (error) {
        if (isUnauthorizedError(error)) {
            return null;
        }

        throw error;
    }
}

// Fetched once per full page load, never on navigation (ui-requirements §7 exception) — refetched only
// after sign-in, and set to null on sign-out or a 401. The server still checks every request.
const authSessionQueryOptions = queryOptions({
    queryKey: AUTH_SESSION_QUERY_KEY,
    queryFn: ({ signal }) => fetchAuthSession(signal),
    staleTime: Infinity,
    gcTime: Infinity,
});

// Signed out: keep the (now null) session query, drop every other cached response.
function clearSession(queryClient: QueryClient): void {
    queryClient.setQueryData(AUTH_SESSION_QUERY_KEY, null);
    queryClient.removeQueries({
        predicate: (query) => query.queryKey[0] !== AUTH_SESSION_QUERY_KEY[0],
    });
}

type AuthProviderProps = {
    children: React.ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
    const { t } = useTranslation('auth');
    const { message } = App.useApp();
    const queryClient = useQueryClient();

    const sessionQuery = useQuery(authSessionQueryOptions);

    // Any 401 UNAUTHORIZED from any request (expired token, deactivated account) ends the session here;
    // ProtectedRoute then redirects to sign-in.
    useEffect(() => setUnauthorizedHandler(() => {
        const wasSignedIn = queryClient.getQueryData(AUTH_SESSION_QUERY_KEY) != null;

        clearSession(queryClient);

        if (wasSignedIn) {
            void message.warning(t('notifications.sessionExpired'));
        }
    }), [queryClient, message, t]);

    // Children render only once the session is known, so route guards never act on a half-loaded state.
    if (sessionQuery.isError) {
        return <QueryErrorState onRetry={() => void sessionQuery.refetch()} fullPage />;
    }

    if (sessionQuery.isPending) {
        return <QueryLoadingState fullPage />;
    }

    const session = sessionQuery.data;

    const signIn = async (form: AuthSignInFormType) => {
        await signInRequest(toAuthSignInRequestDto(form));

        const newSession = await queryClient.fetchQuery({ ...authSessionQueryOptions, staleTime: 0 });

        // Sign-in succeeded but the next request wasn't authenticated: the browser didn't keep the cookie.
        if (!newSession) {
            throw new Error('Signed in, but the session cookie was not accepted by the browser');
        }
    };

    const signOut = async () => {
        await signOutRequest();
        clearSession(queryClient);
    };

    const can = (resource: ResourceCode, permission: PermissionCode) =>
        session?.permissions[resource]?.includes(permission) ?? false;

    return (
        <AuthContext value={{ session, signIn, signOut, can }}>
            {children}
        </AuthContext>
    );
}
