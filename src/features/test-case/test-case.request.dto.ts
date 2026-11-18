import type { PageRequestDto } from '../../shared/request/page.request.dto';
import type { SortParam } from '../../shared/request/sort.request.dto';
import type { TEST_CASE_BULK_ACTION } from './test-case.constant';
import type { TestCasePriority, TestCaseSortField, TestType } from './test-case.type';

// OpenAPI TestCaseCreateRequest — every field required; the steps' array order is their order.
export type TestCaseCreateRequestDto = {
    title: string;
    description: string;
    priority: TestCasePriority;
    type: TestType;
    preConditions: string;
    postConditions: string;
    tags: string[];
    steps: { action: string; expectedResult: string }[];
    suiteIds: number[];
};

// OpenAPI TestCaseUpdateRequest — full replacement (steps and suites as a whole); the body repeats the id.
export type TestCaseUpdateRequestDto = TestCaseCreateRequestDto & {
    id: number;
};

// GET /projects/:projectId/test-cases. Multi-value filters are comma-separated (any of);
// without `sort` the API orders by title A→Z.
export type TestCasePageRequestDto = PageRequestDto & {
    search?: string;
    priority?: string;
    type?: string;
    tags?: string;
    suiteId?: number;
    lastResult?: string;
    sort?: SortParam<TestCaseSortField>;
};

// OpenAPI TestCaseBulkRequest — discriminated by `action`; 1–100 ids without duplicates. All-or-nothing:
// any id that isn't a test case of the project rejects the whole request.
export type TestCaseBulkRequestDto =
    | { action: typeof TEST_CASE_BULK_ACTION.DELETE; testCaseIds: number[] }
    | { action: typeof TEST_CASE_BULK_ACTION.UPDATE_PRIORITY; testCaseIds: number[]; priority: TestCasePriority }
    | { action: typeof TEST_CASE_BULK_ACTION.ASSIGN_TO_SUITE; testCaseIds: number[]; suiteId: number };
