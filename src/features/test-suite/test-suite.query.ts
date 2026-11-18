import type { TestSuitePageRequestDto } from './test-suite.request.dto';

// Every suite query of a project starts with ['test-suites', projectId], so one invalidation refreshes
// them all — e.g. after a test case joins or leaves suites (their testCaseCount changes).
export function testSuitesQueryKey(projectId: number) {
    return ['test-suites', projectId] as const;
}

export function testSuiteListQueryKey(projectId: number, request: TestSuitePageRequestDto) {
    return [...testSuitesQueryKey(projectId), 'list', request] as const;
}

export function testSuiteDetailsQueryKey(projectId: number, suiteId: number | undefined) {
    return [...testSuitesQueryKey(projectId), 'detail', suiteId] as const;
}
