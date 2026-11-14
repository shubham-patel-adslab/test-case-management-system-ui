import { tcmsApiClient } from '../../app/tcms.api.client';
import type { ProjectCreateRequestDto, ProjectPageRequestDto, ProjectUpdateRequestDto } from './project.request.dto';
import type { ProjectDetailsResponseDto, ProjectPageResponseDto } from './project.response.dto';

export async function createProject(request: ProjectCreateRequestDto): Promise<ProjectDetailsResponseDto> {
    const response = await tcmsApiClient.post<ProjectDetailsResponseDto>(
        '/projects',
        request
    );

    return response.data;
}

export async function updateProject(request: ProjectUpdateRequestDto): Promise<ProjectDetailsResponseDto> {
    const response = await tcmsApiClient.put<ProjectDetailsResponseDto>(
        `/projects/${request.id}`,
        request
    );

    return response.data;
}

export async function getProject(projectId: number, signal?: AbortSignal): Promise<ProjectDetailsResponseDto> {
    const response = await tcmsApiClient.get<ProjectDetailsResponseDto>(
        `/projects/${projectId}`,
        { signal }
    );

    return response.data;
}

export async function getProjects(request: ProjectPageRequestDto, signal?: AbortSignal): Promise<ProjectPageResponseDto> {
    const response = await tcmsApiClient.get<ProjectPageResponseDto>(
        '/projects',
        { params: request, signal }
    );

    return response.data;
}
