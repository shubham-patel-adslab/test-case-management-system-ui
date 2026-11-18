import { Outlet } from 'react-router';

import { useCurrentProjectContext } from '../current-project.context';
import { API_ERROR_CODE, getApiErrorCode } from '../../../app/api-error';
import { NotFoundState } from '../../../shared/components/NotFoundState';
import { QueryErrorState } from '../../../shared/components/QueryErrorState';
import { QueryLoadingState } from '../../../shared/components/QueryLoadingState';

// Layout route for /projects/:projectId/…: one place that loads the project and handles a missing one, so
// the pages inside can rely on useCurrentProject().
export function ProjectWorkspaceLayout() {
    const { projectQuery } = useCurrentProjectContext();

    // Not a project id (e.g. /projects/abc), or not found / not one of the user's projects — the API
    // answers 404 for both.
    if (!projectQuery || getApiErrorCode(projectQuery.error) === API_ERROR_CODE.NOT_FOUND) {
        return <NotFoundState />;
    }

    if (projectQuery.isError) {
        return <QueryErrorState onRetry={() => void projectQuery.refetch()} />;
    }

    if (!projectQuery.data) {
        return <QueryLoadingState />;
    }

    return <Outlet />;
}
