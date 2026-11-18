import type { PageRequestDto } from '../../shared/request/page.request.dto';
import type { SortParam } from '../../shared/request/sort.request.dto';
import type { TestExecutionSortField } from './test-execution.type';
import type { ExecutionResult } from '../test-case/test-case.type';

// GET /projects/:projectId/test-executions — the queue, and a test case's history (testCaseId). `status`
// is comma-separated (any of). Without `sort` the API orders by test case title A→Z.
export type TestExecutionPageRequestDto = PageRequestDto & {
    status?: string;
    assigneeId?: string;
    testCaseId?: number;
    suiteRunId?: number;
    sort?: SortParam<TestExecutionSortField>;
};

// OpenAPI TestExecutionAssignRequest — 1–100 test cases; cases already pending for the assignee are skipped.
export type TestExecutionAssignRequestDto = {
    testCaseIds: number[];
    assigneeId: string;
};

// A per-step result, addressed by the step's `order` on the execution.
export type TestExecutionStepResultRequestDto = {
    order: number;
    status: ExecutionResult;
    comment?: string;
};

// OpenAPI TestExecutionResultRequest — record the result of a pending execution (once; 409 afterwards).
export type TestExecutionResultRequestDto = {
    status: ExecutionResult;
    comment?: string;
    stepResults?: TestExecutionStepResultRequestDto[];
};

// OpenAPI TestExecutionCreateRequest — run a test case ad hoc: recorded directly, no pending execution first.
export type TestExecutionCreateRequestDto = TestExecutionResultRequestDto & {
    testCaseId: number;
};
