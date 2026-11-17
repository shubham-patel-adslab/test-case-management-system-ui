import { toPageType } from '../../shared/mapper/page.mapper';
import type { ProjectCreateRequestDto, ProjectUpdateRequestDto } from './project.request.dto';
import type {
    ProjectDetailsResponseDto,
    ProjectMemberCandidatePageResponseDto,
    ProjectMemberResponseDto,
    ProjectPageResponseDto,
} from './project.response.dto';
import type {
    ProjectDetailsType,
    ProjectFormType,
    ProjectMemberCandidatePageType,
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
        memberIds: form.memberIds,
    };
}

export function toProjectUpdateRequestDto(form: ProjectUpdateType): ProjectUpdateRequestDto {
    return {
        ...toProjectCreateRequestDto(form),
        id: form.id,
    };
}

export function toProjectMember(dto: ProjectMemberResponseDto): ProjectMemberType {
    return {
        id: dto.id,
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        status: dto.status,
        role: { code: dto.role.code, name: dto.role.name },
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
        memberIds: project.members.map((member) => member.id),
    };
}

export function toProjectPage(dto: ProjectPageResponseDto): ProjectPageType {
    return toPageType(dto, toProjectDetails);
}

export function toProjectMemberCandidatePage(dto: ProjectMemberCandidatePageResponseDto): ProjectMemberCandidatePageType {
    return toPageType(dto, toProjectMember);
}
