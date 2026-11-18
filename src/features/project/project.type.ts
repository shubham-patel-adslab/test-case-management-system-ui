import { z } from 'zod';

import type { projectFormSchema } from './project.schema';
import type { PROJECT_SORT_FIELDS, PROJECT_STATUSES } from './project.constant';
import type { PageType } from '../../shared/type/page.type';
import type { UserStatus } from '../user/user.type';

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];
export type ProjectSortField = (typeof PROJECT_SORT_FIELDS)[number];

export type ProjectFormType = z.infer<typeof projectFormSchema>;

export type ProjectUpdateType = ProjectFormType & {
    id: number;
};

export type ProjectMemberType = {
    id: string;
    firstName: string;
    lastName: string | null;
    email: string;
    status: UserStatus;
    role: {
        code: string;
        name: string;
    };
};

export type ProjectDetailsType = Omit<ProjectFormType, 'memberIds'> & {
    id: number;
    members: ProjectMemberType[];
    createdAt: string;
    updatedAt: string;
};

export type ProjectPageType = PageType<ProjectDetailsType>;

export type ProjectMemberCandidatePageType = PageType<ProjectMemberType>;
