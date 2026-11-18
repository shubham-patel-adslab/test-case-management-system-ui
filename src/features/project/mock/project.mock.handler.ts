import { http, HttpResponse } from 'msw';

import { projectMock, toProjectDetailsResponse, toProjectMemberResponse, type MockProject } from './project.mock.data';
import { getMockSessionUser, mockHasPermission, withMockPermission } from '../../auth/mock/auth.mock.handler';
import { PERMISSION_CODE, RESOURCE_CODE } from '../../auth/auth.constant';
import type { PermissionCode } from '../../auth/auth.type';
import { compareMockUserNames, mockUserMatchesSearch, userMock } from '../../user/mock/user.mock.data';
import { PROJECT_DEFAULT_SORT, PROJECT_SORT_FIELDS } from '../project.constant';
import type { ProjectCreateRequestDto, ProjectUpdateRequestDto } from '../project.request.dto';
import type { ProjectMemberCandidatePageResponseDto, ProjectPageResponseDto } from '../project.response.dto';
import {
    compareMockText,
    getMockPaging,
    getMockSort,
    mockValidationError,
    toMockPage,
    toMockSortComparator,
} from '../../../shared/mock/page.mock';

const PROJECTS_URL = `${import.meta.env.VITE_TCMS_API_URL}/projects`;

// Like the backend: active and invited users can join a team.
const MEMBER_CANDIDATE_STATUSES = ['ACTIVE', 'INVITED'];

// Error envelope from ui-requirements §6.2. Out of scope is a 404 like a missing project, so non-members
// can't probe which ids exist.
function projectNotFound() {
    return HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'Project not found' } }, { status: 404 });
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

// The projects the signed-in user may read — what analytics covers without a projectId, like the backend's
// getReadScope.
export function getMockProjectsInScope(permission: PermissionCode): MockProject[] {
    const scope = getScope(permission);

    return projectMock.filter((project) => isInScope(project, scope));
}

// For the mocks of everything inside a project (test cases, suites, executions): the project when the
// signed-in user reaches it with this permission's scope — READ for reads, UPDATE for changes, like the
// backend's assertReadable / assertWritable — else undefined (answer 404).
export function findMockProjectInScope(projectId: number, permission: PermissionCode): MockProject | undefined {
    const project = projectMock.find((project) => project.id === projectId);

    return project && isInScope(project, getScope(permission)) ? project : undefined;
}

// Like the backend's setMembers: duplicates and unknown or newly added inactive users are a 400 on the
// exact memberIds[i]; a scoped caller is always kept on the team.
function resolveTeam(memberIds: string[], currentMemberIds: string[], scope: string | null) {
    if (new Set(memberIds).size !== memberIds.length) {
        return { error: mockValidationError([{ field: 'memberIds', message: 'Must not contain duplicates' }]) };
    }

    const details = memberIds.flatMap((userId, index) => {
        const user = userMock.find((user) => user.id === userId);
        const isAssignable = !!user && (user.status !== 'INACTIVE' || currentMemberIds.includes(userId));

        return isAssignable ? [] : [{ field: `memberIds[${index}]`, message: 'Unknown or inactive user' }];
    });

    if (details.length > 0) {
        return { error: mockValidationError(details) };
    }

    return { team: scope === null || memberIds.includes(scope) ? memberIds : [...memberIds, scope] };
}

export const projectMockHandler = [
    // Name A→Z (case-insensitive) unless `sort` says otherwise, like the backend.
    http.get(PROJECTS_URL, withMockPermission(RESOURCE_CODE.PROJECT, PERMISSION_CODE.READ, ({ request }) => {
        const { url, page, pageSize } = getMockPaging(request);
        const { sort, error } = getMockSort(url, PROJECT_SORT_FIELDS, PROJECT_DEFAULT_SORT);

        if (error) {
            return error;
        }

        const scope = getScope(PERMISSION_CODE.READ);
        const projects = projectMock
            .filter((project) => isInScope(project, scope))
            .sort(toMockSortComparator<MockProject, typeof sort.field>(sort, {
                name: (a, b) => compareMockText(a.name, b.name),
                createdAt: (a, b) => a.createdAt.localeCompare(b.createdAt),
                updatedAt: (a, b) => a.updatedAt.localeCompare(b.updatedAt),
            }))
            .map(toProjectDetailsResponse);

        const response: ProjectPageResponseDto = toMockPage(projects, page, pageSize);

        return HttpResponse.json(response);
    })),

    // Before '/:projectId', which would otherwise match it. Not scoped to a project: the create form uses it.
    // Always by name (no `sort`), like the backend.
    http.get(`${PROJECTS_URL}/member-candidates`, withMockPermission(RESOURCE_CODE.PROJECT, PERMISSION_CODE.UPDATE, ({ request }) => {
        const { url, page, pageSize } = getMockPaging(request);
        const search = url.searchParams.get('search') ?? '';

        const candidates = userMock
            .filter((user) => MEMBER_CANDIDATE_STATUSES.includes(user.status))
            .filter((user) => mockUserMatchesSearch(user, search))
            .sort((a, b) => compareMockUserNames(a, b) || a.id.localeCompare(b.id))
            .map(toProjectMemberResponse);

        const response: ProjectMemberCandidatePageResponseDto = toMockPage(candidates, page, pageSize);

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
