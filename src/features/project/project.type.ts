import { z } from 'zod';

import type { projectFormSchema } from './project.schema';
import type { PROJECT_STATUSES } from './project.constant';
import type { PageType } from '../../shared/type/page.type';

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export type ProjectFormType = z.infer<typeof projectFormSchema>;

export type ProjectUpdateType = ProjectFormType & {
    id: number;
};

export type ProjectMemberType = {
    id: number;
    name: string;
    email: string;
};

export type ProjectDetailsType = ProjectFormType & {
    id: number;
    members: ProjectMemberType[];
    createdAt: string;
    updatedAt: string;
};

export type ProjectPageType = PageType<ProjectDetailsType>;
