import { toPageType } from '../../shared/mapper/page.mapper';
import type { UserCreateRequestDto, UserUpdateRequestDto } from './user.request.dto';
import type { RoleResponseDto, UserDetailsResponseDto, UserPageResponseDto, UserReferenceResponseDto } from './user.response.dto';
import type { RoleType, UserDetailsType, UserFormType, UserPageType, UserReferenceType, UserUpdateType } from './user.type';

export function toUserCreateRequestDto(form: UserFormType): UserCreateRequestDto {
    return {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        roleCode: form.roleCode,
    };
}

export function toUserUpdateRequestDto(form: UserUpdateType): UserUpdateRequestDto {
    return {
        ...toUserCreateRequestDto(form),
        id: form.id,
    };
}

export function toUserDetails(dto: UserDetailsResponseDto): UserDetailsType {
    return {
        id: dto.id,
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        status: dto.status,
        role: { code: dto.role.code, name: dto.role.name },
        createdAt: dto.createdAt,
        updatedAt: dto.updatedAt,
    };
}

// Update form pre-fill: only the editable fields, so the form's dirty check compares like with like.
export function toUserFormValues(user: UserDetailsType): UserFormType {
    return {
        firstName: user.firstName,
        lastName: user.lastName ?? '', // the input needs a string; "" is sent back, which the API stores as null
        email: user.email,
        roleCode: user.role.code,
    };
}

export function toUserPage(dto: UserPageResponseDto): UserPageType {
    return toPageType(dto, toUserDetails);
}

export function toRole(dto: RoleResponseDto): RoleType {
    return {
        code: dto.code,
        name: dto.name,
        description: dto.description,
    };
}

export function toUserReference(dto: UserReferenceResponseDto): UserReferenceType {
    return { id: dto.id, firstName: dto.firstName, lastName: dto.lastName };
}
