import type { TestExecutionStepResponseDto } from '../test-execution.response.dto';
import type { ExecutionAuditAction, ExecutionStatus } from '../test-execution.type';
import { testCaseMock } from '../../test-case/mock/test-case.mock.data';
import { userMock } from '../../user/mock/user.mock.data';

// An execution as the mock "database" holds it. `steps` is the run's own copy once recorded; a pending run
// has none yet (it shows the test case's current steps), like the backend's test_execution_steps.
export type MockExecution = {
    id: number;
    projectId: number;
    testCaseId: number | null;
    testCaseTitle: string;
    suiteRunId: number | null;
    status: ExecutionStatus;
    assigneeId: string | null;
    executedById: string | null;
    executedAt: string | null;
    comment: string;
    steps: TestExecutionStepResponseDto[] | null;
    createdAt: string;
    updatedAt: string;
};

export type MockAuditLog = {
    id: number;
    executionId: number;
    action: ExecutionAuditAction;
    actorId: string;
    details: Record<string, unknown>;
    createdAt: string;
};

const HOUR_MS = 60 * 60 * 1000;
// userMock order: admin, test lead, tester, read-only, …
const [, testLead, tester] = userMock;

export const executionMock: MockExecution[] = [];
export const auditLogMock: MockAuditLog[] = [];

export function addMockAuditLog(executionId: number, action: ExecutionAuditAction, actorId: string, details: Record<string, unknown>, createdAt: string): void {
    auditLogMock.push({ id: auditLogMock.length + 1, executionId, action, actorId, details, createdAt });
}

export function nextMockExecutionId(): number {
    return executionMock.reduce((maxId, execution) => Math.max(maxId, execution.id), 0) + 1;
}

// History that matches the seeded test cases: one recorded run per test case with a last result (at its
// lastExecutedAt), assigned by the test lead; and some pending work for the tester and the test lead.
function seedExecutions(): void {
    testCaseMock.forEach((testCase, index) => {
        if (testCase.lastResult && testCase.lastExecutedAt) {
            const createdAt = new Date(Date.parse(testCase.lastExecutedAt) - 2 * HOUR_MS).toISOString();
            const executor = index % 4 === 0 ? testLead : tester;
            const execution: MockExecution = {
                id: executionMock.length + 1,
                projectId: testCase.projectId,
                testCaseId: testCase.id,
                testCaseTitle: testCase.title,
                suiteRunId: null,
                status: testCase.lastResult,
                assigneeId: executor.id,
                executedById: executor.id,
                executedAt: testCase.lastExecutedAt,
                comment: testCase.lastResult === 'PASS' ? '' : 'See the step comments.',
                steps: testCase.steps.map((step, stepIndex) => ({
                    order: step.order,
                    action: step.action,
                    expectedResult: step.expectedResult,
                    status: stepIndex === 0 ? testCase.lastResult : null,
                    comment: '',
                })),
                createdAt,
                updatedAt: testCase.lastExecutedAt,
            };

            executionMock.push(execution);
            addMockAuditLog(execution.id, 'CREATED', testLead.id, { assigneeId: executor.id }, createdAt);
            addMockAuditLog(execution.id, 'RESULT_RECORDED', executor.id, { status: execution.status }, testCase.lastExecutedAt);
        }
    });

    // Pending: every 7th test case for the tester, every 11th for the test lead.
    testCaseMock.forEach((testCase, index) => {
        const assignee = index % 7 === 0 ? tester : index % 11 === 0 ? testLead : undefined;

        if (assignee) {
            const createdAt = new Date(Date.parse(testCase.createdAt) + 24 * HOUR_MS).toISOString();
            const execution: MockExecution = {
                id: executionMock.length + 1,
                projectId: testCase.projectId,
                testCaseId: testCase.id,
                testCaseTitle: testCase.title,
                suiteRunId: null,
                status: 'PENDING',
                assigneeId: assignee.id,
                executedById: null,
                executedAt: null,
                comment: '',
                steps: null,
                createdAt,
                updatedAt: createdAt,
            };

            executionMock.push(execution);
            addMockAuditLog(execution.id, 'CREATED', testLead.id, { assigneeId: assignee.id }, createdAt);
        }
    });
}

seedExecutions();

// Like the backend when a test case is deleted: its pending runs go (nothing happened yet); recorded runs
// stay with their own copy, without the link.
export function detachMockExecutionsOfTestCase(testCaseId: number): void {
    for (let index = executionMock.length - 1; index >= 0; index--) {
        const execution = executionMock[index];

        if (execution.testCaseId === testCaseId) {
            if (execution.status === 'PENDING') {
                executionMock.splice(index, 1);
            } else {
                execution.testCaseId = null;
            }
        }
    }
}
