import { http, HttpResponse } from 'msw';

import {
    addMockAuditLog,
    auditLogMock,
    executionMock,
    nextMockExecutionId,
    type MockExecution,
} from './test-execution.mock.data';
import { EXECUTION_PENDING } from '../test-execution.constant';
import type {
    TestExecutionAssignRequestDto,
    TestExecutionCreateRequestDto,
    TestExecutionResultRequestDto,
} from '../test-execution.request.dto';
import type {
    TestExecutionAuditLogResponseDto,
    TestExecutionDetailsResponseDto,
    TestExecutionPageResponseDto,
    TestExecutionProgressResponseDto,
    TestExecutionSummaryResponseDto,
} from '../test-execution.response.dto';
import { getMockSessionUser, mockErrorResponse, mockHasPermission, withMockPermission } from '../../auth/mock/auth.mock.handler';
import { PERMISSION_CODE, RESOURCE_CODE } from '../../auth/auth.constant';
import { findMockAttachmentsOfExecution, toAttachmentResponse } from '../../attachment/mock/attachment.mock.data';
import { findMockDefectOfExecution, toDefectDetailsResponse, toDefectReferenceResponse } from '../../defect/mock/defect.mock.data';
import { findMockProjectInScope } from '../../project/mock/project.mock.handler';
import type { MockProject } from '../../project/mock/project.mock.data';
import type { MockTestCase } from '../../test-case/mock/test-case.mock.data';
import { findMockTestCase } from '../../test-case/mock/test-case.mock.handler';
import { userMock } from '../../user/mock/user.mock.data';
import type { UserReferenceResponseDto } from '../../user/user.response.dto';
import { getMockPaging, mockValidationError, toMockPage } from '../../../shared/mock/page.mock';

const EXECUTIONS_URL = `${import.meta.env.VITE_TCMS_API_URL}/projects/:projectId/test-executions`;

const notFound = (message: string) => mockErrorResponse(404, 'NOT_FOUND', message);

function toUserReference(userId: string | null): UserReferenceResponseDto | null {
    const user = userMock.find((candidate) => candidate.id === userId);

    return user ? { id: user.id, firstName: user.firstName, lastName: user.lastName } : null;
}

export function toMockExecutionSummary(execution: MockExecution): TestExecutionSummaryResponseDto {
    const defect = findMockDefectOfExecution(execution.id);

    return {
        id: execution.id,
        projectId: execution.projectId,
        testCaseId: execution.testCaseId,
        testCaseTitle: execution.testCaseTitle,
        suiteRunId: execution.suiteRunId,
        status: execution.status,
        assignee: toUserReference(execution.assigneeId),
        executedBy: toUserReference(execution.executedById),
        executedAt: execution.executedAt,
        defect: defect ? toDefectReferenceResponse(defect) : null,
        createdAt: execution.createdAt,
        updatedAt: execution.updatedAt,
    };
}

// A pending run shows the test case's current steps; a recorded one its own copy.
function toDetails(execution: MockExecution): TestExecutionDetailsResponseDto {
    const testCase = execution.testCaseId === null ? undefined : findMockTestCase(execution.projectId, execution.testCaseId);
    const steps = execution.steps ?? (testCase?.steps ?? []).map((step) => ({
        order: step.order,
        action: step.action,
        expectedResult: step.expectedResult,
        status: null,
        comment: '',
    }));

    const defect = findMockDefectOfExecution(execution.id);

    return {
        ...toMockExecutionSummary(execution),
        defect: defect ? toDefectDetailsResponse(defect) : null,
        comment: execution.comment,
        steps,
        attachments: findMockAttachmentsOfExecution(execution.id).map(toAttachmentResponse),
    };
}

function findExecution(params: Record<string, unknown>, permission: 'READ' | 'UPDATE'): MockExecution | undefined {
    const projectId = Number(params.projectId);

    return findMockProjectInScope(projectId, permission)
        ? executionMock.find((execution) => execution.id === Number(params.executionId) && execution.projectId === projectId)
        : undefined;
}

// The backend's assignee rule: active, may execute, and reaches the project (member, or ALL_PROJECTS).
export function isMockAssignable(userId: string, project: MockProject): boolean {
    const assignee = userMock.find((user) => user.id === userId);

    return assignee?.status === 'ACTIVE'
        && mockHasPermission(assignee, RESOURCE_CODE.TEST_EXECUTION, PERMISSION_CODE.UPDATE)
        && (project.memberIds.includes(assignee.id) || mockHasPermission(assignee, RESOURCE_CODE.ALL_PROJECTS, PERMISSION_CODE.READ));
}

// Counts per status — the backend's progress.
export function toMockProgress(executions: MockExecution[]): TestExecutionProgressResponseDto {
    const count = (status: string) => executions.filter((execution) => execution.status === status).length;

    return {
        total: executions.length,
        pending: count('PENDING'),
        passed: count('PASS'),
        failed: count('FAIL'),
        blocked: count('BLOCKED'),
        skipped: count('SKIPPED'),
    };
}

// The backend's result checks: step orders must exist (once each), and a run with a failed step can't pass.
function validateResult(testCase: Pick<MockTestCase, 'steps'>, body: TestExecutionResultRequestDto) {
    const stepResults = body.stepResults ?? [];
    const unknown = stepResults.flatMap((result, index) => (
        testCase.steps.some((step) => step.order === result.order) ? [] : [{ field: `stepResults[${index}].order`, message: 'No step with this order' }]
    ));

    if (unknown.length > 0) {
        return mockValidationError(unknown);
    }

    if (body.status === 'PASS' && stepResults.some((result) => result.status === 'FAIL')) {
        return mockValidationError([{ field: 'status', message: 'Cannot be PASS when a step failed' }]);
    }

    return undefined;
}

// Recording: the run keeps a copy of the test case's title and steps with the results, the test case gets
// its latest result, and the audit trail an entry.
function record(execution: MockExecution, testCase: MockTestCase, body: TestExecutionResultRequestDto, actorId: string): void {
    const now = new Date().toISOString();
    const resultsByOrder = new Map((body.stepResults ?? []).map((result) => [result.order, result]));

    Object.assign(execution, {
        testCaseTitle: testCase.title,
        status: body.status,
        executedById: actorId,
        executedAt: now,
        comment: body.comment ?? '',
        steps: testCase.steps.map((step) => ({
            order: step.order,
            action: step.action,
            expectedResult: step.expectedResult,
            status: resultsByOrder.get(step.order)?.status ?? null,
            comment: resultsByOrder.get(step.order)?.comment ?? '',
        })),
        updatedAt: now,
    });
    Object.assign(testCase, { lastResult: body.status, lastExecutedAt: now });
    addMockAuditLog(execution.id, 'RESULT_RECORDED', actorId, { status: body.status }, now);
}

export const testExecutionMockHandler = [
    // Queue and history, newest first.
    http.get(EXECUTIONS_URL, withMockPermission(RESOURCE_CODE.TEST_EXECUTION, PERMISSION_CODE.READ, ({ params, request }) => {
        const projectId = Number(params.projectId);

        if (!findMockProjectInScope(projectId, PERMISSION_CODE.READ)) {
            return notFound('Project not found');
        }

        const { url, page, pageSize } = getMockPaging(request);
        const statuses = url.searchParams.get('status')?.split(',').filter(Boolean) ?? [];
        const assigneeId = url.searchParams.get('assigneeId');
        const testCaseId = Number(url.searchParams.get('testCaseId')) || undefined;
        const suiteRunId = Number(url.searchParams.get('suiteRunId')) || undefined;

        const executions = executionMock
            .filter((execution) => execution.projectId === projectId)
            .filter((execution) => statuses.length === 0 || statuses.includes(execution.status))
            .filter((execution) => !assigneeId || execution.assigneeId === assigneeId)
            .filter((execution) => testCaseId === undefined || execution.testCaseId === testCaseId)
            .filter((execution) => suiteRunId === undefined || execution.suiteRunId === suiteRunId)
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id);

        const executionPage = toMockPage(executions, page, pageSize);
        const response: TestExecutionPageResponseDto = { ...executionPage, items: executionPage.items.map(toMockExecutionSummary) };

        return HttpResponse.json(response);
    })),

    http.get(`${EXECUTIONS_URL}/progress`, withMockPermission(RESOURCE_CODE.TEST_EXECUTION, PERMISSION_CODE.READ, ({ params, request }) => {
        const projectId = Number(params.projectId);

        if (!findMockProjectInScope(projectId, PERMISSION_CODE.READ)) {
            return notFound('Project not found');
        }

        const assigneeId = new URL(request.url).searchParams.get('assigneeId');
        const executions = executionMock.filter((execution) => execution.projectId === projectId
            && (!assigneeId || execution.assigneeId === assigneeId));

        return HttpResponse.json(toMockProgress(executions));
    })),

    // The assignee must be active, may execute, and reach the project (member, or ALL_PROJECTS); cases
    // already pending for them are skipped.
    http.post(`${EXECUTIONS_URL}/assignments`, withMockPermission(RESOURCE_CODE.TEST_ASSIGNMENT, PERMISSION_CODE.CREATE, async ({ params, request }) => {
        const projectId = Number(params.projectId);
        const project = findMockProjectInScope(projectId, PERMISSION_CODE.UPDATE);

        if (!project) {
            return notFound('Project not found');
        }

        const body = await request.json() as TestExecutionAssignRequestDto;

        if (!isMockAssignable(body.assigneeId, project)) {
            return mockValidationError([{ field: 'assigneeId', message: 'Must be an active member of the project who can execute tests' }]);
        }

        const unknown = body.testCaseIds.flatMap((testCaseId, index) => (
            findMockTestCase(projectId, testCaseId) ? [] : [{ field: `testCaseIds[${index}]`, message: 'Unknown test case in this project' }]
        ));

        if (unknown.length > 0) {
            return mockValidationError(unknown);
        }

        const now = new Date().toISOString();
        const actorId = getMockSessionUser()!.id;
        let createdCount = 0;

        body.testCaseIds.forEach((testCaseId) => {
            const isAlreadyPending = executionMock.some((execution) => execution.testCaseId === testCaseId
                && execution.status === EXECUTION_PENDING && execution.assigneeId === body.assigneeId);

            if (!isAlreadyPending) {
                const testCase = findMockTestCase(projectId, testCaseId)!;
                const execution: MockExecution = {
                    id: nextMockExecutionId(),
                    projectId,
                    testCaseId,
                    testCaseTitle: testCase.title,
                    suiteRunId: null,
                    status: EXECUTION_PENDING,
                    assigneeId: body.assigneeId,
                    executedById: null,
                    executedAt: null,
                    comment: '',
                    steps: null,
                    createdAt: now,
                    updatedAt: now,
                };

                executionMock.push(execution);
                addMockAuditLog(execution.id, 'CREATED', actorId, { assigneeId: body.assigneeId }, now);
                createdCount++;
            }
        });

        return HttpResponse.json({ createdCount }, { status: 201 });
    })),

    // Ad hoc: created with its result.
    http.post(EXECUTIONS_URL, withMockPermission(RESOURCE_CODE.TEST_EXECUTION, PERMISSION_CODE.CREATE, async ({ params, request }) => {
        const projectId = Number(params.projectId);

        if (!findMockProjectInScope(projectId, PERMISSION_CODE.UPDATE)) {
            return notFound('Project not found');
        }

        const body = await request.json() as TestExecutionCreateRequestDto;
        const testCase = findMockTestCase(projectId, body.testCaseId);

        if (!testCase) {
            return mockValidationError([{ field: 'testCaseId', message: 'Unknown test case in this project' }]);
        }

        const invalid = validateResult(testCase, body);

        if (invalid) {
            return invalid;
        }

        const now = new Date().toISOString();
        const execution: MockExecution = {
            id: nextMockExecutionId(),
            projectId,
            testCaseId: testCase.id,
            testCaseTitle: testCase.title,
            suiteRunId: null,
            status: EXECUTION_PENDING,
            assigneeId: null,
            executedById: null,
            executedAt: null,
            comment: '',
            steps: null,
            createdAt: now,
            updatedAt: now,
        };

        executionMock.push(execution);
        record(execution, testCase, body, getMockSessionUser()!.id);

        return HttpResponse.json(toDetails(execution), { status: 201 });
    })),

    http.get(`${EXECUTIONS_URL}/:executionId`, withMockPermission(RESOURCE_CODE.TEST_EXECUTION, PERMISSION_CODE.READ, ({ params }) => {
        const execution = findExecution(params, PERMISSION_CODE.READ);

        return execution ? HttpResponse.json(toDetails(execution)) : notFound('Test execution not found');
    })),

    // Record once — any project member who may execute, not only the assignee; 409 when already recorded.
    http.put(`${EXECUTIONS_URL}/:executionId`, withMockPermission(RESOURCE_CODE.TEST_EXECUTION, PERMISSION_CODE.UPDATE, async ({ params, request }) => {
        const execution = findExecution(params, PERMISSION_CODE.UPDATE);

        if (!execution) {
            return notFound('Test execution not found');
        }

        if (execution.status !== EXECUTION_PENDING) {
            return mockErrorResponse(409, 'CONFLICT', 'This execution\'s result is already recorded. Run the test case again for a new result.');
        }

        const testCase = findMockTestCase(execution.projectId, execution.testCaseId!)!;
        const body = await request.json() as TestExecutionResultRequestDto;
        const invalid = validateResult(testCase, body);

        if (invalid) {
            return invalid;
        }

        record(execution, testCase, body, getMockSessionUser()!.id);

        return HttpResponse.json(toDetails(execution));
    })),

    // Oldest first, a plain array.
    http.get(`${EXECUTIONS_URL}/:executionId/audit`, withMockPermission(RESOURCE_CODE.TEST_EXECUTION, PERMISSION_CODE.READ, ({ params }) => {
        const execution = findExecution(params, PERMISSION_CODE.READ);

        if (!execution) {
            return notFound('Test execution not found');
        }

        const response: TestExecutionAuditLogResponseDto[] = auditLogMock
            .filter((entry) => entry.executionId === execution.id)
            .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id - b.id)
            .map((entry) => ({
                id: entry.id,
                action: entry.action,
                actor: toUserReference(entry.actorId),
                details: entry.details,
                createdAt: entry.createdAt,
            }));

        return HttpResponse.json(response);
    })),
];
