import type { PageRequestDto } from '../../shared/request/page.request.dto';
import type { SortParam } from '../../shared/request/sort.request.dto';
import type { ProjectSortField, ProjectStatus } from './project.type';

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

// Without `sort` the API orders by name A→Z.
export type ProjectPageRequestDto = PageRequestDto & {
    sort?: SortParam<ProjectSortField>;
};

// GET /projects/member-candidates — matches first name, last name, "first last" and email. Always by name
// (no `sort`).
export type ProjectMemberCandidatePageRequestDto = PageRequestDto & {
    search?: string;
};
