import type { TestExecutionPageRequestDto } from './test-execution.request.dto';

// Every execution query of a project starts with ['test-executions', projectId]: recording a result or
// assigning refreshes the queue, progress, histories and details in one invalidation.
export function testExecutionsQueryKey(projectId: number) {
    return ['test-executions', projectId] as const;
}

export function testExecutionListQueryKey(projectId: number, request: TestExecutionPageRequestDto) {
    return [...testExecutionsQueryKey(projectId), 'list', request] as const;
}

export function testExecutionProgressQueryKey(projectId: number, assigneeId: string | undefined) {
    return [...testExecutionsQueryKey(projectId), 'progress', assigneeId ?? null] as const;
}

export function testExecutionDetailsQueryKey(projectId: number, executionId: number | undefined) {
    return [...testExecutionsQueryKey(projectId), 'detail', executionId] as const;
}

export function testExecutionAuditQueryKey(projectId: number, executionId: number) {
    return [...testExecutionsQueryKey(projectId), 'audit', executionId] as const;
}
