import type { PageResponseDto } from '../../shared/response/page.response.dto';
import type { ExecutionResult, TestCasePriority, TestType } from './test-case.type';

// OpenAPI TestCaseSummaryResponse — list items, without steps.
export type TestCaseSummaryResponseDto = {
    id: number;
    projectId: number;
    title: string;
    description: string;
    priority: TestCasePriority;
    type: TestType;
    preConditions: string;
    postConditions: string;
    // Lowercase (the API normalizes them).
    tags: string[];
    suiteIds: number[];
    lastResult: ExecutionResult | null;
    lastExecutedAt: string | null;
    // null once the creator's user row is removed.
    createdBy: string | null;
    createdAt: string;
    updatedAt: string;
};

// OpenAPI TestStepResponse — `order` is 1..n.
export type TestStepResponseDto = {
    id: number;
    order: number;
    action: string;
    expectedResult: string;
};

// OpenAPI TestCaseDetailsResponse.
export type TestCaseDetailsResponseDto = TestCaseSummaryResponseDto & {
    steps: TestStepResponseDto[];
};

export type TestCasePageResponseDto = PageResponseDto<TestCaseSummaryResponseDto>;

// OpenAPI TestCaseBulkResponse — for ASSIGN_TO_SUITE only the newly added cases count (cases already in
// the suite keep their place).
export type TestCaseBulkResponseDto = {
    affectedCount: number;
};
