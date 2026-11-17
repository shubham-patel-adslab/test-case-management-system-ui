import { http, HttpResponse } from 'msw';

import { projectMock, toProjectDetailsResponse, toProjectMemberResponse, type MockProject } from './project.mock.data';
import { getMockSessionUser, mockHasPermission, withMockPermission } from '../../auth/mock/auth.mock.handler';
import { PERMISSION_CODE, RESOURCE_CODE } from '../../auth/auth.constant';
import type { PermissionCode } from '../../auth/auth.type';
import { mockUserMatchesSearch, userMock } from '../../user/mock/user.mock.data';
import type { ProjectCreateRequestDto, ProjectUpdateRequestDto } from '../project.request.dto';
import type { ProjectMemberCandidatePageResponseDto, ProjectPageResponseDto } from '../project.response.dto';
import type { ErrorDetailDto } from '../../../shared/response/error.response.dto';
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '../../../shared/constant/page.constant';

const PROJECTS_URL = `${import.meta.env.VITE_TCMS_API_URL}/projects`;

// Like the backend: active and invited users can join a team.
const MEMBER_CANDIDATE_STATUSES = ['ACTIVE', 'INVITED'];

// Error envelope from ui-requirements §6.2. Out of scope is a 404 like a missing project, so non-members
// can't probe which ids exist.
function projectNotFound() {
    return HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'Project not found' } }, { status: 404 });
}

function validationError(details: ErrorDetailDto[]) {
    return HttpResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Request validation failed', details } },
        { status: 400 },
    );
}

function getPaging(request: Request) {
    const url = new URL(request.url);

    return {
        url,
        page: Number(url.searchParams.get('page')) || DEFAULT_PAGE,
        pageSize: Number(url.searchParams.get('pageSize')) || DEFAULT_PAGE_SIZE,
    };
}

function toPage<TItem>(items: TItem[], page: number, pageSize: number) {
    const startIndex = (page - 1) * pageSize;

    return {
        items: items.slice(startIndex, startIndex + pageSize),
        page,
        pageSize,
        totalItems: items.length,
        totalPages: Math.ceil(items.length / pageSize),
    };
}

// The backend's membership scope: an ALL_PROJECTS grant reaches every project, everyone else only their own.
// Returns the signed-in user's id when scoped, null when not.
function getScope(permission: PermissionCode): string | null {
    const user = getMockSessionUser()!;

    return mockHasPermission(user, RESOURCE_CODE.ALL_PROJECTS, permission) ? null : user.id;
}

function isInScope(project: MockProject, scope: string | null): boolean {
    return scope === null || project.memberIds.includes(scope);
}

// Like the backend's setMembers: duplicates and unknown or newly added inactive users are a 400 on the
// exact memberIds[i]; a scoped caller is always kept on the team.
function resolveTeam(memberIds: string[], currentMemberIds: string[], scope: string | null) {
    if (new Set(memberIds).size !== memberIds.length) {
        return { error: validationError([{ field: 'memberIds', message: 'Must not contain duplicates' }]) };
    }

    const details = memberIds.flatMap((userId, index) => {
        const user = userMock.find((user) => user.id === userId);
        const isAssignable = !!user && (user.status !== 'INACTIVE' || currentMemberIds.includes(userId));

        return isAssignable ? [] : [{ field: `memberIds[${index}]`, message: 'Unknown or inactive user' }];
    });

    if (details.length > 0) {
        return { error: validationError(details) };
    }

    return { team: scope === null || memberIds.includes(scope) ? memberIds : [...memberIds, scope] };
}

export const projectMockHandler = [
    // Newest first, like the backend.
    http.get(PROJECTS_URL, withMockPermission(RESOURCE_CODE.PROJECT, PERMISSION_CODE.READ, ({ request }) => {
        const { page, pageSize } = getPaging(request);
        const scope = getScope(PERMISSION_CODE.READ);

        const projects = projectMock
            .filter((project) => isInScope(project, scope))
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id)
            .map(toProjectDetailsResponse);

        const response: ProjectPageResponseDto = toPage(projects, page, pageSize);

        return HttpResponse.json(response);
    })),

    // Before '/:projectId', which would otherwise match it. Not scoped to a project: the create form uses it.
    http.get(`${PROJECTS_URL}/member-candidates`, withMockPermission(RESOURCE_CODE.PROJECT, PERMISSION_CODE.UPDATE, ({ request }) => {
        const { url, page, pageSize } = getPaging(request);
        const search = url.searchParams.get('search') ?? '';

        const candidates = userMock
            .filter((user) => MEMBER_CANDIDATE_STATUSES.includes(user.status))
            .filter((user) => mockUserMatchesSearch(user, search))
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
            .map(toProjectMemberResponse);

        const response: ProjectMemberCandidatePageResponseDto = toPage(candidates, page, pageSize);

        return HttpResponse.json(response);
    })),

    http.get(`${PROJECTS_URL}/:projectId`, withMockPermission(RESOURCE_CODE.PROJECT, PERMISSION_CODE.READ, ({ params }) => {
        const scope = getScope(PERMISSION_CODE.READ);
        const project = projectMock.find((project) => project.id === Number(params.projectId));

        return project && isInScope(project, scope) ? HttpResponse.json(toProjectDetailsResponse(project)) : projectNotFound();
    })),

    http.post(PROJECTS_URL, withMockPermission(RESOURCE_CODE.PROJECT, PERMISSION_CODE.CREATE, async ({ request }) => {
        const body = await request.json() as ProjectCreateRequestDto;
        // The creator's READ scope decides whether they must join the team to see the project afterwards.
        const { team, error } = resolveTeam(body.memberIds, [], getScope(PERMISSION_CODE.READ));

        if (error) {
            return error;
        }

        const now = new Date().toISOString();
        const project: MockProject = {
            id: projectMock.reduce((maxId, project) => Math.max(maxId, project.id), 0) + 1,
            name: body.name,
            description: body.description,
            version: body.version,
            status: body.status,
            memberIds: team,
            createdAt: now,
            updatedAt: now,
        };

        projectMock.push(project);

        return HttpResponse.json(toProjectDetailsResponse(project), { status: 201 });
    })),

    http.put(`${PROJECTS_URL}/:projectId`, withMockPermission(RESOURCE_CODE.PROJECT, PERMISSION_CODE.UPDATE, async ({ params, request }) => {
        const body = await request.json() as ProjectUpdateRequestDto;
        const scope = getScope(PERMISSION_CODE.UPDATE);
        const project = projectMock.find((project) => project.id === Number(params.projectId));

        if (!project || !isInScope(project, scope)) {
            return projectNotFound();
        }

        const { team, error } = resolveTeam(body.memberIds, project.memberIds, scope);

        if (error) {
            return error;
        }

        Object.assign(project, {
            name: body.name,
            description: body.description,
            version: body.version,
            status: body.status,
            memberIds: team,
            updatedAt: new Date().toISOString(),
        });

        return HttpResponse.json(toProjectDetailsResponse(project));
    })),
];
