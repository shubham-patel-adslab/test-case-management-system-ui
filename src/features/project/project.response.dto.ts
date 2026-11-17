import type { PageResponseDto } from '../../shared/response/page.response.dto';
import type { UserStatus } from '../user/user.type';
import type { ProjectStatus } from './project.type';

// A team member, or a candidate in the member picker. `status` marks invited members and members who
// were deactivated after joining (they stay on the team).
export type ProjectMemberResponseDto = {
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

export type ProjectMemberCandidatePageResponseDto = PageResponseDto<ProjectMemberResponseDto>;
