import type { PageRequestDto } from '../../shared/request/page.request.dto';
import type { SortParam } from '../../shared/request/sort.request.dto';
import type { TestSuiteSortField } from './test-suite.type';

// Without `sort` the API orders by name A→Z.
export type TestSuitePageRequestDto = PageRequestDto & {
    sort?: SortParam<TestSuiteSortField>;
};

// OpenAPI TestSuiteCreateRequest.
export type TestSuiteCreateRequestDto = {
    name: string;
    description: string;
};

// OpenAPI TestSuiteUpdateRequest — the body repeats the id.
export type TestSuiteUpdateRequestDto = TestSuiteCreateRequestDto & {
    id: number;
};

// OpenAPI TestSuiteCasesAddRequest — 1–100 ids, appended in this order; cases already in the suite keep
// their place.
export type TestSuiteCasesAddRequestDto = {
    testCaseIds: number[];
};

// OpenAPI TestSuiteCasesReorderRequest — every test case of the suite exactly once, in the new order.
export type TestSuiteCasesReorderRequestDto = {
    testCaseIds: number[];
};
