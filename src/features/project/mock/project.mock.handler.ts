import { http, HttpResponse } from 'msw';

import { projectDetailsMock } from './project.mock.data';
import type { ProjectCreateRequestDto, ProjectUpdateRequestDto } from '../project.request.dto';
import type { ProjectDetailsResponseDto, ProjectPageResponseDto } from '../project.response.dto';
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '../../../shared/constant/page.constant';

const PROJECTS_URL = `${import.meta.env.VITE_TCMS_API_URL}/projects`;

// Error envelope from ui-requirements §6.2.
function projectNotFound() {
    return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Project not found' } },
        { status: 404 },
    );
}

export const projectMockHandler = [
    http.get(PROJECTS_URL, ({ request }) => {
        const url = new URL(request.url);
        const page = Number(url.searchParams.get('page')) || DEFAULT_PAGE;
        const pageSize = Number(url.searchParams.get('pageSize')) || DEFAULT_PAGE_SIZE;

        const startIndex = (page - 1) * pageSize;
        const totalItems = projectDetailsMock.length;

        const response: ProjectPageResponseDto = {
            items: projectDetailsMock.slice(startIndex, startIndex + pageSize),
            page,
            pageSize,
            totalItems,
            totalPages: Math.ceil(totalItems / pageSize),
        };

        return HttpResponse.json(response);
    }),

    http.get(`${PROJECTS_URL}/:projectId`, ({ params }) => {
        const projectId = Number(params.projectId);
        const project = projectDetailsMock.find((project) => project.id === projectId);

        return project ? HttpResponse.json(project) : projectNotFound();
    }),

    http.post(PROJECTS_URL, async ({ request }) => {
        const body = await request.json() as ProjectCreateRequestDto;

        const newId = projectDetailsMock.reduce((maxId, project) => Math.max(maxId, project.id), 0) + 1;
        const now = new Date().toISOString();

        const project: ProjectDetailsResponseDto = {
            ...body,
            id: newId,
            members: [],
            createdAt: now,
            updatedAt: now,
        };

        projectDetailsMock.push(project);

        return HttpResponse.json(project, { status: 201 });
    }),

    http.put(`${PROJECTS_URL}/:projectId`, async ({ params, request }) => {
        const projectId = Number(params.projectId);
        const body = await request.json() as ProjectUpdateRequestDto;

        const index = projectDetailsMock.findIndex((project) => project.id === projectId);

        if (index === -1) {
            return projectNotFound();
        }

        const updatedProject: ProjectDetailsResponseDto = {
            ...projectDetailsMock[index],
            name: body.name,
            description: body.description,
            version: body.version,
            status: body.status,
            updatedAt: new Date().toISOString(),
        };

        projectDetailsMock[index] = updatedProject;

        return HttpResponse.json(updatedProject);
    }),
];
