import type { PageResponseDto } from '../../shared/response/page.response.dto';
import type { UserStatus } from './user.type';

// Role codes are data on the server (roles_std), not a fixed enum.
export type UserRoleResponseDto = {
    code: string;
    name: string;
};

export type UserDetailsResponseDto = {
    id: string;
    firstName: string;
    lastName: string | null; // null when the user has no last name
    email: string;
    status: UserStatus;
    role: UserRoleResponseDto;
    createdAt: string;
    updatedAt: string;
};

export type UserPageResponseDto = PageResponseDto<UserDetailsResponseDto>;

// GET /roles — a plain array, not the page envelope.
export type RoleResponseDto = {
    code: string;
    name: string;
    description: string;
};
