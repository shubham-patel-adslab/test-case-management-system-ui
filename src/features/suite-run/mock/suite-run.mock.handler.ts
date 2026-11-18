import { http, HttpResponse } from 'msw';

import type { SuiteRunCreateRequestDto } from '../suite-run.request.dto';
import type { SuiteRunDetailsResponseDto, SuiteRunPageResponseDto, SuiteRunSummaryResponseDto } from '../suite-run.response.dto';
import { getMockSessionUser, mockErrorResponse, mockHasPermission, withMockPermission } from '../../auth/mock/auth.mock.handler';
import { PERMISSION_CODE, RESOURCE_CODE } from '../../auth/auth.constant';
import { findMockProjectInScope } from '../../project/mock/project.mock.handler';
import { findMockTestCase } from '../../test-case/mock/test-case.mock.handler';
import { addMockAuditLog, executionMock, nextMockExecutionId } from '../../test-execution/mock/test-execution.mock.data';
import { isMockAssignable, toMockExecutionSummary, toMockProgress } from '../../test-execution/mock/test-execution.mock.handler';
import { testSuiteMock } from '../../test-suite/mock/test-suite.mock.data';
import { userMock } from '../../user/mock/user.mock.data';
import { getMockPaging, mockValidationError, toMockPage } from '../../../shared/mock/page.mock';

const API_URL = import.meta.env.VITE_TCMS_API_URL;

// A run as the mock "database" holds it; its executions are ordinary executions with its id.
type MockSuiteRun = {
    id: number;
    projectId: number;
    suiteId: number | null;
    suiteName: string;
    createdById: string;
    createdAt: string;
};

const suiteRunMock: MockSuiteRun[] = [];

const notFound = (message: string) => mockErrorResponse(404, 'NOT_FOUND', message);

// In suite order = creation order, like the backend's `ORDER BY e.id`.
const executionsOf = (runId: number) => executionMock.filter((execution) => execution.suiteRunId === runId).sort((a, b) => a.id - b.id);

function toSummary(run: MockSuiteRun): SuiteRunSummaryResponseDto {
    const createdBy = userMock.find((user) => user.id === run.createdById);

    return {
        id: run.id,
        projectId: run.projectId,
        // null once the suite is deleted; the report keeps its name.
        suiteId: testSuiteMock.some((suite) => suite.id === run.suiteId) ? run.suiteId : null,
        suiteName: run.suiteName,
        createdBy: createdBy ? { id: createdBy.id, firstName: createdBy.firstName, lastName: createdBy.lastName } : null,
        createdAt: run.createdAt,
        progress: toMockProgress(executionsOf(run.id)),
    };
}

function toDetails(run: MockSuiteRun): SuiteRunDetailsResponseDto {
    return { ...toSummary(run), executions: executionsOf(run.id).map(toMockExecutionSummary) };
}

export const suiteRunMockHandler = [
    // One pending execution per test case, in suite order. Assigning to someone else needs TEST_ASSIGNMENT
    // CREATE; an empty suite is a 409.
    http.post(`${API_URL}/projects/:projectId/test-suites/:suiteId/runs`, withMockPermission(RESOURCE_CODE.TEST_EXECUTION, PERMISSION_CODE.CREATE, async ({ params, request }) => {
        const projectId = Number(params.projectId);
        const user = getMockSessionUser()!;
        const body = await request.json().catch(() => ({})) as SuiteRunCreateRequestDto;

        if (body.assigneeId !== undefined && body.assigneeId !== user.id
            && !mockHasPermission(user, RESOURCE_CODE.TEST_ASSIGNMENT, PERMISSION_CODE.CREATE)) {
            return mockErrorResponse(403, 'FORBIDDEN', 'Missing permission TEST_ASSIGNMENT CREATE');
        }

        const project = findMockProjectInScope(projectId, PERMISSION_CODE.UPDATE);

        if (!project) {
            return notFound('Project not found');
        }

        if (body.assigneeId !== undefined && !isMockAssignable(body.assigneeId, project)) {
            return mockValidationError([{ field: 'assigneeId', message: 'Must be an active member of the project who can execute tests' }]);
        }

        const suite = testSuiteMock.find((candidate) => candidate.id === Number(params.suiteId) && candidate.projectId === projectId);

        if (!suite) {
            return notFound('Test suite not found');
        }

        const testCases = suite.testCaseIds.flatMap((testCaseId) => findMockTestCase(projectId, testCaseId) ?? []);

        if (testCases.length === 0) {
            return mockErrorResponse(409, 'CONFLICT', 'The test suite has no test cases to run');
        }

        const now = new Date().toISOString();
        const run: MockSuiteRun = { id: suiteRunMock.length + 1, projectId, suiteId: suite.id, suiteName: suite.name, createdById: user.id, createdAt: now };

        suiteRunMock.push(run);
        testCases.forEach((testCase) => {
            const executionId = nextMockExecutionId();

            executionMock.push({
                id: executionId,
                projectId,
                testCaseId: testCase.id,
                testCaseTitle: testCase.title,
                suiteRunId: run.id,
                status: 'PENDING',
                assigneeId: body.assigneeId ?? null,
                executedById: null,
                executedAt: null,
                comment: '',
                steps: null,
                createdAt: now,
                updatedAt: now,
            });
            addMockAuditLog(executionId, 'CREATED', user.id, { suiteRunId: run.id, assigneeId: body.assigneeId ?? null }, now);
        });

        return HttpResponse.json(toDetails(run), { status: 201, headers: { Location: `/api/projects/${projectId}/suite-runs/${run.id}` } });
    })),

    // A suite's runs, newest first.
    http.get(`${API_URL}/projects/:projectId/test-suites/:suiteId/runs`, withMockPermission(RESOURCE_CODE.TEST_EXECUTION, PERMISSION_CODE.READ, ({ params, request }) => {
        const projectId = Number(params.projectId);
        const suiteId = Number(params.suiteId);

        if (!findMockProjectInScope(projectId, PERMISSION_CODE.READ)
            || !testSuiteMock.some((suite) => suite.id === suiteId && suite.projectId === projectId)) {
            return notFound('Test suite not found');
        }

        const { page, pageSize } = getMockPaging(request);
        const runs = suiteRunMock
            .filter((run) => run.projectId === projectId && run.suiteId === suiteId)
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id);
        const runPage = toMockPage(runs, page, pageSize);
        const response: SuiteRunPageResponseDto = { ...runPage, items: runPage.items.map(toSummary) };

        return HttpResponse.json(response);
    })),

    // The suite report — also after the suite is deleted.
    http.get(`${API_URL}/projects/:projectId/suite-runs/:runId`, withMockPermission(RESOURCE_CODE.TEST_EXECUTION, PERMISSION_CODE.READ, ({ params }) => {
        const projectId = Number(params.projectId);
        const run = findMockProjectInScope(projectId, PERMISSION_CODE.READ)
            ? suiteRunMock.find((candidate) => candidate.id === Number(params.runId) && candidate.projectId === projectId)
            : undefined;

        return run ? HttpResponse.json(toDetails(run)) : notFound('Suite run not found');
    })),
];
