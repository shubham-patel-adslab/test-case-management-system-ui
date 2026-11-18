import type { SuiteRunPageRequestDto } from './suite-run.request.dto';

// Every suite run query of a project starts with ['suite-runs', projectId]. A run's progress changes when
// one of its executions is recorded, so recording invalidates this prefix too.
export function suiteRunsQueryKey(projectId: number) {
    return ['suite-runs', projectId] as const;
}

export function suiteRunListQueryKey(projectId: number, suiteId: number, request: SuiteRunPageRequestDto) {
    return [...suiteRunsQueryKey(projectId), 'list', suiteId, request] as const;
}

export function suiteRunDetailsQueryKey(projectId: number, runId: number | undefined) {
    return [...suiteRunsQueryKey(projectId), 'detail', runId] as const;
}
