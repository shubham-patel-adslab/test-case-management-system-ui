import { lazy } from 'react';
import type { RouteObject } from 'react-router';

import { RequirePermission } from '../auth/components/RequirePermission';
import { PERMISSION_CODE, RESOURCE_CODE } from '../auth/auth.constant';

const ExecutionQueuePage = lazy(async () => {
    const module = await import('./pages/ExecutionQueuePage');
    return { default: module.ExecutionQueuePage };
});

const ExecutionPage = lazy(async () => {
    const module = await import('./pages/ExecutionPage');
    return { default: module.ExecutionPage };
});

const TestCaseExecutePage = lazy(async () => {
    const module = await import('./pages/TestCaseExecutePage');
    return { default: module.TestCaseExecutePage };
});

// Relative to the project workspace route (/projects/:projectId); the app router passes them into
// projectWorkspaceRoute(). A pending run's page is readable by every role — recording on it is gated in
// the page (shown disabled, ui-requirements §2 rule 3); an ad hoc run needs TEST_EXECUTION CREATE.
export const testExecutionRoutes: RouteObject[] = [
    {
        element: <RequirePermission resource={RESOURCE_CODE.TEST_EXECUTION} permission={PERMISSION_CODE.READ} />,
        children: [
            { path: 'executions', element: <ExecutionQueuePage /> },
            { path: 'executions/:executionId', element: <ExecutionPage /> },
        ],
    },
    {
        element: <RequirePermission resource={RESOURCE_CODE.TEST_EXECUTION} permission={PERMISSION_CODE.CREATE} />,
        children: [{ path: 'test-cases/:testCaseId/execute', element: <TestCaseExecutePage /> }],
    },
];
