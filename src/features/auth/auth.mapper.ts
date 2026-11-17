import type { AuthSignInRequestDto, InvitationAcceptRequestDto } from './auth.request.dto';
import type { AuthorizationContextResponseDto, AuthUserResponseDto } from './auth.response.dto';
import type { AuthSessionType, AuthSetPasswordFormType, AuthSignInFormType, AuthUserType } from './auth.type';

export function toAuthSignInRequestDto(form: AuthSignInFormType): AuthSignInRequestDto {
    return {
        email: form.email,
        password: form.password,
    };
}

function toAuthUser(dto: AuthUserResponseDto): AuthUserType {
    return {
        id: dto.id,
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
    };
}

export function toAuthSession(
    userDto: AuthUserResponseDto,
    authorizationDto: AuthorizationContextResponseDto
): AuthSessionType {
    return {
        user: toAuthUser(userDto),
        role: {
            code: authorizationDto.role.code,
            name: authorizationDto.role.name,
        },
        permissions: authorizationDto.permissions,
    };
}

// confirmPassword is a form-only check; only the password goes to the API.
export function toInvitationAcceptRequestDto(token: string, form: AuthSetPasswordFormType): InvitationAcceptRequestDto {
    return {
        token,
        password: form.password,
    };
}
