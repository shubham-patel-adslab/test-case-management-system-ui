import { tcmsApiClient } from '../../app/tcms.api.client';
import type { AuthSignInRequestDto, InvitationAcceptRequestDto } from './auth.request.dto';
import type { AuthorizationContextResponseDto, AuthUserResponseDto } from './auth.response.dto';

// Sets the httpOnly access-token cookie; the token itself never reaches page scripts.
export async function signIn(request: AuthSignInRequestDto): Promise<AuthUserResponseDto> {
    const response = await tcmsApiClient.post<AuthUserResponseDto>(
        '/auth/sign-in',
        request
    );

    return response.data;
}

export async function signOut(): Promise<void> {
    await tcmsApiClient.post('/auth/sign-out');
}

export async function getCurrentUser(signal?: AbortSignal): Promise<AuthUserResponseDto> {
    const response = await tcmsApiClient.get<AuthUserResponseDto>(
        '/auth/me',
        { signal }
    );

    return response.data;
}

export async function getAuthorizationContext(signal?: AbortSignal): Promise<AuthorizationContextResponseDto> {
    const response = await tcmsApiClient.get<AuthorizationContextResponseDto>(
        '/authorization/me',
        { signal }
    );

    return response.data;
}

// Public: the token from the invitation link is the proof. 204 on success.
export async function acceptInvitation(request: InvitationAcceptRequestDto): Promise<void> {
    await tcmsApiClient.post('/invitations/accept', request);
}
