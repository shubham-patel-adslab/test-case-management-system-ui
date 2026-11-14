import type { PageRequestDto } from '../../shared/request/page.request.dto';
import type { ProjectStatus } from './project.type';

export type ProjectCreateRequestDto = {
    name: string;
    description: string;
    version: string;
    status: ProjectStatus;
};

export type ProjectUpdateRequestDto = ProjectCreateRequestDto & {
    id: number;
};

export type ProjectPageRequestDto = PageRequestDto;
