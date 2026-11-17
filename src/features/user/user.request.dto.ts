import type { PageRequestDto } from '../../shared/request/page.request.dto';
import type { UserSettableStatus, UserStatus } from './user.type';

// No password: the user sets it from the emailed invitation link.
export type UserCreateRequestDto = {
    firstName: string;
    lastName: string;
    email: string;
    roleCode: string;
};

export type UserUpdateRequestDto = UserCreateRequestDto & {
    id: string;
};

export type UserStatusUpdateRequestDto = {
    status: UserSettableStatus;
};

export type UserPageRequestDto = PageRequestDto & {
    search?: string;
    status?: UserStatus;
};
