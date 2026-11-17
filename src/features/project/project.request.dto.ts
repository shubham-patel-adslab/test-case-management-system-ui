import type { PageRequestDto } from '../../shared/request/page.request.dto';
import type { ProjectStatus } from './project.type';

// memberIds is the whole team (user ids): create and update set it as a whole, there are no separate
// member endpoints.
export type ProjectCreateRequestDto = {
    name: string;
    description: string;
    version: string;
    status: ProjectStatus;
    memberIds: string[];
};

export type ProjectUpdateRequestDto = ProjectCreateRequestDto & {
    id: number;
};

export type ProjectPageRequestDto = PageRequestDto;

// GET /projects/member-candidates — matches first name, last name, "first last" and email.
export type ProjectMemberCandidatePageRequestDto = PageRequestDto & {
    search?: string;
};
