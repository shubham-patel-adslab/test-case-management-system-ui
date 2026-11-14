import type { PageResponseDto } from '../../shared/response/page.response.dto';
import type { ProjectStatus } from './project.type';

// Members also carry `role` on the wire (ui-requirements §6.5). It's left out until the
// auth/user feature defines the Role type — nothing in the project screens reads it yet.
export type ProjectMemberResponseDto = {
    id: number;
    name: string;
    email: string;
};

export type ProjectDetailsResponseDto = {
    id: number;
    name: string;
    description: string;
    version: string;
    status: ProjectStatus;
    members: ProjectMemberResponseDto[];
    createdAt: string;
    updatedAt: string;
};

export type ProjectPageResponseDto = PageResponseDto<ProjectDetailsResponseDto>;
