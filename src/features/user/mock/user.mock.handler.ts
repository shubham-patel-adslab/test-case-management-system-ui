import { http, HttpResponse } from 'msw';

import { compareMockUserNames, mockUserMatchesSearch, roleMock, toUserDetailsResponse, userMock, type MockUser } from './user.mock.data';
import { USER_DEFAULT_SORT, USER_SORT_FIELDS } from '../user.constant';
import type { UserCreateRequestDto, UserStatusUpdateRequestDto, UserUpdateRequestDto } from '../user.request.dto';
import type { UserDetailsResponseDto, UserPageResponseDto } from '../user.response.dto';
import { getMockSessionUser, mockErrorResponse, withMockPermission } from '../../auth/mock/auth.mock.handler';
import { PERMISSION_CODE, RESOURCE_CODE } from '../../auth/auth.constant';
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '../../../shared/constant/page.constant';
import { compareMockText, getMockSort, toMockSortComparator } from '../../../shared/mock/page.mock';

const API_URL = import.meta.env.VITE_TCMS_API_URL;
const USERS_URL = `${API_URL}/users`;
const { USER } = RESOURCE_CODE;
const { CREATE, READ, UPDATE } = PERMISSION_CODE;

function userNotFound() {
    return mockErrorResponse(404, 'NOT_FOUND', 'User not found');
}

function emailInUse() {
    return mockErrorResponse(409, 'CONFLICT', 'Email is already in use', 'email');
}

function findRole(code: string) {
    const role = roleMock.find((role) => role.code === code);

    return role && { code: role.code, name: role.name };
}

// Stands in for the invitation email (the real backend sends it through SMTP — Mailpit in development):
// the mock prints the set-password link so the flow can be completed without a mail server.
function sendMockInvitation(user: MockUser): void {
    user.invitationToken = crypto.randomUUID();
    console.info(`[MSW] Invitation for ${user.email}: ${location.origin}/set-password#token=${user.invitationToken}`);
}

export const userMockHandler = [
    http.get(USERS_URL, withMockPermission(USER, READ, ({ request }) => {
        const url = new URL(request.url);
        const page = Number(url.searchParams.get('page')) || DEFAULT_PAGE;
        const pageSize = Number(url.searchParams.get('pageSize')) || DEFAULT_PAGE_SIZE;
        const search = url.searchParams.get('search')?.trim().toLowerCase();
        const status = url.searchParams.get('status');
        const { sort, error } = getMockSort(url, USER_SORT_FIELDS, USER_DEFAULT_SORT);

        if (error) {
            return error;
        }

        // Name A→Z (case-insensitive) unless `sort` says otherwise, like the backend.
        const matches = userMock
            .filter((user) => !status || user.status === status)
            .filter((user) => mockUserMatchesSearch(user, search ?? ''))
            .sort(toMockSortComparator<MockUser, typeof sort.field>(sort, {
                name: compareMockUserNames,
                email: (a, b) => compareMockText(a.email, b.email),
                createdAt: (a, b) => a.createdAt.localeCompare(b.createdAt),
            }));

        const startIndex = (page - 1) * pageSize;
        const response: UserPageResponseDto = {
            items: matches.slice(startIndex, startIndex + pageSize).map(toUserDetailsResponse),
            page,
            pageSize,
            totalItems: matches.length,
            totalPages: Math.ceil(matches.length / pageSize),
        };

        return HttpResponse.json(response);
    })),

    http.get(`${USERS_URL}/:userId`, withMockPermission(USER, READ, ({ params }) => {
        const user = userMock.find((user) => user.id === params.userId);

        return user ? HttpResponse.json(toUserDetailsResponse(user)) : userNotFound();
    })),

    http.post(USERS_URL, withMockPermission(USER, CREATE, async ({ request }) => {
        const body = await request.json() as UserCreateRequestDto;
        const email = body.email.trim().toLowerCase();
        const role = findRole(body.roleCode);

        if (!role) {
            return mockErrorResponse(400, 'VALIDATION_ERROR', 'Invalid request', 'roleCode');
        }

        if (userMock.some((user) => user.email === email)) {
            return emailInUse();
        }

        const now = new Date().toISOString();
        const user: MockUser = {
            id: crypto.randomUUID(),
            firstName: body.firstName.trim(),
            lastName: body.lastName.trim() || null, // like the API: blank is stored as null
            email,
            status: 'INVITED',
            role,
            createdAt: now,
            updatedAt: now,
            password: null,
            invitationToken: null,
        };

        userMock.push(user);
        sendMockInvitation(user);

        return HttpResponse.json(toUserDetailsResponse(user), { status: 201 });
    })),

    http.put(`${USERS_URL}/:userId`, withMockPermission(USER, UPDATE, async ({ params, request }) => {
        const body = await request.json() as UserUpdateRequestDto;
        const user = userMock.find((user) => user.id === params.userId);

        if (!user) {
            return userNotFound();
        }

        if (body.id !== user.id) {
            return mockErrorResponse(400, 'VALIDATION_ERROR', 'Body id must match the URL', 'id');
        }

        const role = findRole(body.roleCode);

        if (!role) {
            return mockErrorResponse(400, 'VALIDATION_ERROR', 'Invalid request', 'roleCode');
        }

        if (user.id === getMockSessionUser()!.id && role.code !== user.role.code) {
            return mockErrorResponse(403, 'FORBIDDEN', 'You can\'t change your own role');
        }

        const email = body.email.trim().toLowerCase();

        if (userMock.some((other) => other.id !== user.id && other.email === email)) {
            return emailInUse();
        }

        const isInvitedEmailChange = user.status === 'INVITED' && email !== user.email;

        Object.assign(user, {
            firstName: body.firstName.trim(),
            lastName: body.lastName.trim() || null, // like the API: blank is stored as null
            email,
            role,
            updatedAt: new Date().toISOString(),
        });

        // Same as the backend: a pending invitation follows the email address.
        if (isInvitedEmailChange) {
            sendMockInvitation(user);
        }

        return HttpResponse.json<UserDetailsResponseDto>(toUserDetailsResponse(user));
    })),

    http.patch(`${USERS_URL}/:userId/status`, withMockPermission(USER, UPDATE, async ({ params, request }) => {
        const body = await request.json() as UserStatusUpdateRequestDto;
        const user = userMock.find((user) => user.id === params.userId);

        if (!user) {
            return userNotFound();
        }

        if (user.id === getMockSessionUser()!.id) {
            return mockErrorResponse(403, 'FORBIDDEN', 'You can\'t change your own status');
        }

        // Deactivating revokes a pending invitation; reactivating someone who never set a password makes
        // them INVITED again (the admin then resends the invitation).
        if (body.status === 'INACTIVE') {
            user.status = 'INACTIVE';
            user.invitationToken = null;
        } else {
            user.status = user.password ? 'ACTIVE' : 'INVITED';
        }

        user.updatedAt = new Date().toISOString();

        return HttpResponse.json<UserDetailsResponseDto>(toUserDetailsResponse(user));
    })),

    http.post(`${USERS_URL}/:userId/invitation`, withMockPermission(USER, UPDATE, ({ params }) => {
        const user = userMock.find((user) => user.id === params.userId);

        if (!user) {
            return userNotFound();
        }

        if (user.status !== 'INVITED') {
            return mockErrorResponse(409, 'CONFLICT', 'Only a user who hasn\'t set a password yet can be sent an invitation');
        }

        sendMockInvitation(user);

        return new HttpResponse(null, { status: 204 });
    })),

    // By name (Admin, Read-only, Tester, Test lead), like the backend.
    http.get(`${API_URL}/roles`, withMockPermission(USER, READ, () => HttpResponse.json(
        [...roleMock].sort((a, b) => compareMockText(a.name, b.name) || a.code.localeCompare(b.code)),
    ))),
];
