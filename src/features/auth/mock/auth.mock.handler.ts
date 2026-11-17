import { http, HttpResponse, type HttpResponseResolver } from 'msw';

import { rolePermissionsMock } from './auth.mock.data';
import type { AuthSignInRequestDto, InvitationAcceptRequestDto } from '../auth.request.dto';
import type { AuthorizationContextResponseDto, AuthUserResponseDto } from '../auth.response.dto';
import { PASSWORD_MIN_LENGTH } from '../auth.constant';
import type { PermissionCode, ResourceCode } from '../auth.type';
import { userMock, type MockUser } from '../../user/mock/user.mock.data';

const API_URL = import.meta.env.VITE_TCMS_API_URL;

// Stands in for the httpOnly cookie: the signed-in mock user's id, kept in sessionStorage so a reload stays
// signed in like the real cookie. Mock code only — the app itself never touches storage.
const MOCK_SESSION_STORAGE_KEY = 'tcms-mock-session-user-id';

export function mockErrorResponse(status: number, code: string, message: string, field?: string) {
    const details = field ? [{ field, message }] : undefined;

    return HttpResponse.json({ error: { code, message, details } }, { status });
}

// Like the backend's `authenticate`: only an ACTIVE user's session counts.
export function getMockSessionUser(): MockUser | undefined {
    const userId = sessionStorage.getItem(MOCK_SESSION_STORAGE_KEY);

    return userMock.find((user) => user.id === userId && user.status === 'ACTIVE');
}

function toAuthUserResponse(user: MockUser): AuthUserResponseDto {
    return { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email };
}

// Wraps a mock handler so it answers 401 UNAUTHORIZED when no one is signed in — the backend's
// protected-by-default routes.
export function withMockAuth(resolver: HttpResponseResolver): HttpResponseResolver {
    return (info) => getMockSessionUser()
        ? resolver(info)
        : mockErrorResponse(401, 'UNAUTHORIZED', 'Authentication required');
}

// Like the backend's authorize(resource, permission): 401 when signed out, 403 without the grant.
export function withMockPermission(
    resource: ResourceCode,
    permission: PermissionCode,
    resolver: HttpResponseResolver,
): HttpResponseResolver {
    return withMockAuth((info) => {
        const permissions = rolePermissionsMock[getMockSessionUser()!.role.code] ?? {};

        return permissions[resource]?.includes(permission)
            ? resolver(info)
            : mockErrorResponse(403, 'FORBIDDEN', `Missing permission ${resource} ${permission}`);
    });
}

export const authMockHandler = [
    http.post(`${API_URL}/auth/sign-in`, async ({ request }) => {
        const body = await request.json() as AuthSignInRequestDto;
        const email = body.email.trim().toLowerCase();
        const user = userMock.find((user) => user.email === email);

        if (!user?.password || body.password !== user.password) {
            return mockErrorResponse(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
        }

        if (user.status !== 'ACTIVE') {
            return mockErrorResponse(403, 'ACCOUNT_INACTIVE', 'This account has been deactivated');
        }

        sessionStorage.setItem(MOCK_SESSION_STORAGE_KEY, user.id);

        return HttpResponse.json(toAuthUserResponse(user));
    }),

    http.post(`${API_URL}/auth/sign-out`, () => {
        sessionStorage.removeItem(MOCK_SESSION_STORAGE_KEY);

        return new HttpResponse(null, { status: 204 });
    }),

    http.get(`${API_URL}/auth/me`, withMockAuth(() => {
        return HttpResponse.json(toAuthUserResponse(getMockSessionUser()!));
    })),

    http.get(`${API_URL}/authorization/me`, withMockAuth(() => {
        const user = getMockSessionUser()!;
        const response: AuthorizationContextResponseDto = {
            role: user.role,
            permissions: rolePermissionsMock[user.role.code] ?? {},
        };

        return HttpResponse.json(response);
    })),

    // Public, like the backend: the token from the invitation link is the proof.
    http.post(`${API_URL}/invitations/accept`, async ({ request }) => {
        const body = await request.json() as InvitationAcceptRequestDto;

        if (body.password.length < PASSWORD_MIN_LENGTH) {
            return mockErrorResponse(400, 'VALIDATION_ERROR', 'Invalid request', 'password');
        }

        const user = userMock.find((user) => user.status === 'INVITED' && user.invitationToken === body.token);

        if (!user) {
            return mockErrorResponse(400, 'INVALID_INVITATION', 'This invitation link is invalid or has expired');
        }

        user.password = body.password;
        user.status = 'ACTIVE';
        user.invitationToken = null;
        user.updatedAt = new Date().toISOString();

        return new HttpResponse(null, { status: 204 });
    }),
];
