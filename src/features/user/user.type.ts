import { z } from 'zod';

import type { userFormSchema } from './user.schema';
import type { USER_SETTABLE_STATUSES, USER_SORT_FIELDS, USER_STATUSES } from './user.constant';
import type { PageType } from '../../shared/type/page.type';

export type UserStatus = (typeof USER_STATUSES)[number];
export type UserSettableStatus = (typeof USER_SETTABLE_STATUSES)[number];
export type UserSortField = (typeof USER_SORT_FIELDS)[number];

export type UserFormType = z.infer<typeof userFormSchema>;

export type UserUpdateType = UserFormType & {
    id: string;
};

export type UserRoleType = {
    code: string;
    name: string;
};

export type UserDetailsType = {
    id: string;
    firstName: string;
    lastName: string | null;
    email: string;
    status: UserStatus;
    role: UserRoleType;
    createdAt: string;
    updatedAt: string;
};

export type UserPageType = PageType<UserDetailsType>;

export type RoleType = {
    code: string;
    name: string;
    description: string;
};

// Who did something (executions, suite runs, defects, attachments, audit).
export type UserReferenceType = {
    id: string;
    firstName: string;
    lastName: string | null;
};
