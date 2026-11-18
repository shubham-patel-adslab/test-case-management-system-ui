import type { TestCasePageRequestDto } from './test-case.request.dto';

// Every test case query of a project starts with ['test-cases', projectId], so a change invalidates the
// lists and details of that project in one call.
export function testCasesQueryKey(projectId: number) {
    return ['test-cases', projectId] as const;
}

export function testCaseListQueryKey(projectId: number, request: TestCasePageRequestDto) {
    return [...testCasesQueryKey(projectId), 'list', request] as const;
}

export function testCaseDetailsQueryKey(projectId: number, testCaseId: number | undefined) {
    return [...testCasesQueryKey(projectId), 'detail', testCaseId] as const;
}
