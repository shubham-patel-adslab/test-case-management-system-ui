import { useQuery } from '@tanstack/react-query';

import { getTestSuites } from './test-suite.api';
import { TEST_SUITE_OPTIONS_PAGE_SIZE } from './test-suite.constant';
import { testSuiteListQueryKey } from './test-suite.query';
import type { TestSuitePageResponseDto } from './test-suite.response.dto';

export type TestSuiteOption = { value: number; label: string };

function toTestSuiteOptions(page: TestSuitePageResponseDto): TestSuiteOption[] {
    return page.items.map((suite) => ({ value: suite.id, label: suite.name }));
}

// A project's suites as select options, by name (the API's default order, so no `sort`) — used by the test case form, filter and list (suite
// names for the ids on each test case).
export function useTestSuiteOptions(projectId: number) {
    const request = { page: 1, pageSize: TEST_SUITE_OPTIONS_PAGE_SIZE };

    return useQuery({
        queryKey: testSuiteListQueryKey(projectId, request),
        queryFn: ({ signal }) => getTestSuites(projectId, request, signal),
        select: toTestSuiteOptions,
    });
}
