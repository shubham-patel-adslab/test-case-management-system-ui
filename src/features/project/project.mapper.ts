import { toPageType } from '../../shared/mapper/page.mapper';
import type { ProjectCreateRequestDto, ProjectUpdateRequestDto } from './project.request.dto';
import type { ProjectDetailsResponseDto, ProjectMemberResponseDto, ProjectPageResponseDto } from './project.response.dto';
import type {
    ProjectDetailsType,
    ProjectFormType,
    ProjectMemberType,
    ProjectPageType,
    ProjectUpdateType,
} from './project.type';

export function toProjectCreateRequestDto(form: ProjectFormType): ProjectCreateRequestDto {
    return {
        name: form.name,
        description: form.description,
        version: form.version,
        status: form.status,
    };
}

export function toProjectUpdateRequestDto(form: ProjectUpdateType): ProjectUpdateRequestDto {
    return {
        ...toProjectCreateRequestDto(form),
        id: form.id,
    };
}

function toProjectMember(dto: ProjectMemberResponseDto): ProjectMemberType {
    return {
        id: dto.id,
        name: dto.name,
        email: dto.email,
    };
}

export function toProjectDetails(dto: ProjectDetailsResponseDto): ProjectDetailsType {
    return {
        id: dto.id,
        name: dto.name,
        description: dto.description,
        version: dto.version,
        status: dto.status,
        members: dto.members.map(toProjectMember),
        createdAt: dto.createdAt,
        updatedAt: dto.updatedAt,
    };
}

// Update form pre-fill: only the editable fields, so the form's dirty check compares like with like.
export function toProjectFormValues(project: ProjectDetailsType): ProjectFormType {
    return {
        name: project.name,
        description: project.description,
        version: project.version,
        status: project.status,
    };
}

export function toProjectPage(dto: ProjectPageResponseDto): ProjectPageType {
    return toPageType(dto, toProjectDetails);
}
