import type { PageResponseDto } from '../../shared/response/page.response.dto';
import type { TestCasePriority, TestType } from '../test-case/test-case.type';

// OpenAPI TestSuiteSummaryResponse — list items.
export type TestSuiteSummaryResponseDto = {
    id: number;
    projectId: number;
    name: string;
    description: string;
    testCaseCount: number;
    // null once the creator's user row is removed.
    createdBy: string | null;
    createdAt: string;
    updatedAt: string;
};

// OpenAPI TestSuiteCaseResponse — `order` is 1..n without gaps.
export type TestSuiteCaseResponseDto = {
    id: number;
    order: number;
    title: string;
    priority: TestCasePriority;
    type: TestType;
};

// OpenAPI TestSuiteDetailsResponse — all its test cases, in order (no paging).
export type TestSuiteDetailsResponseDto = TestSuiteSummaryResponseDto & {
    testCases: TestSuiteCaseResponseDto[];
};

export type TestSuitePageResponseDto = PageResponseDto<TestSuiteSummaryResponseDto>;
