import { tcmsApiClient } from '../../app/tcms.api.client';
import type {
    UserCreateRequestDto,
    UserPageRequestDto,
    UserStatusUpdateRequestDto,
    UserUpdateRequestDto,
} from './user.request.dto';
import type { RoleResponseDto, UserDetailsResponseDto, UserPageResponseDto } from './user.response.dto';

// Invites the user: created INVITED and emailed a set-password link. A 502 EMAIL_DELIVERY_FAILED means the
// user was created but the email didn't go out.
export async function createUser(request: UserCreateRequestDto): Promise<UserDetailsResponseDto> {
    const response = await tcmsApiClient.post<UserDetailsResponseDto>(
        '/users',
        request
    );

    return response.data;
}

export async function updateUser(request: UserUpdateRequestDto): Promise<UserDetailsResponseDto> {
    const response = await tcmsApiClient.put<UserDetailsResponseDto>(
        `/users/${request.id}`,
        request
    );

    return response.data;
}

export async function updateUserStatus(userId: string, request: UserStatusUpdateRequestDto): Promise<UserDetailsResponseDto> {
    const response = await tcmsApiClient.patch<UserDetailsResponseDto>(
        `/users/${userId}/status`,
        request
    );

    return response.data;
}

// Only for INVITED users; every earlier link stops working.
export async function resendInvitation(userId: string): Promise<void> {
    await tcmsApiClient.post(`/users/${userId}/invitation`);
}

export async function getUser(userId: string, signal?: AbortSignal): Promise<UserDetailsResponseDto> {
    const response = await tcmsApiClient.get<UserDetailsResponseDto>(
        `/users/${userId}`,
        { signal }
    );

    return response.data;
}

export async function getUsers(request: UserPageRequestDto, signal?: AbortSignal): Promise<UserPageResponseDto> {
    const response = await tcmsApiClient.get<UserPageResponseDto>(
        '/users',
        { params: request, signal }
    );

    return response.data;
}

// Active roles for the user form's role picker. Lives here because the user form is its only consumer.
export async function getRoles(signal?: AbortSignal): Promise<RoleResponseDto[]> {
    const response = await tcmsApiClient.get<RoleResponseDto[]>(
        '/roles',
        { signal }
    );

    return response.data;
}
