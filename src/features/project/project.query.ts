// One project's details query, shared by the current-project context and the project form, so both read
// and invalidate the same cache entry (saving a project invalidates every ['projects', …] query).
export function projectDetailsQueryKey(projectId: number | null | undefined) {
    return ['projects', 'detail', projectId] as const;
}
