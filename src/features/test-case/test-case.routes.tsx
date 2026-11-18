import { lazy } from 'react';
import type { RouteObject } from 'react-router';

import { RequirePermission } from '../auth/components/RequirePermission';
import { PERMISSION_CODE, RESOURCE_CODE } from '../auth/auth.constant';

const TestCasePaginationPage = lazy(async () => {
    const module = await import('./pages/TestCasePaginationPage');
    return { default: module.TestCasePaginationPage };
});

const TestCaseViewPage = lazy(async () => {
    const module = await import('./pages/TestCaseViewPage');
    return { default: module.TestCaseViewPage };
});

const TestCaseFormPage = lazy(async () => {
    const module = await import('./pages/TestCaseFormPage');
    return { default: module.TestCaseFormPage };
});

// Relative to the project workspace route (/projects/:projectId); the app router passes them into
// projectWorkspaceRoute(). Each group sits behind the TEST_CASE permission its page needs.
export const testCaseRoutes: RouteObject[] = [
    {
        element: <RequirePermission resource={RESOURCE_CODE.TEST_CASE} permission={PERMISSION_CODE.READ} />,
        children: [
            { path: 'test-cases', element: <TestCasePaginationPage /> },
            { path: 'test-cases/:testCaseId', element: <TestCaseViewPage /> },
        ],
    },
    {
        element: <RequirePermission resource={RESOURCE_CODE.TEST_CASE} permission={PERMISSION_CODE.CREATE} />,
        children: [{ path: 'test-cases/create', element: <TestCaseFormPage /> }],
    },
    {
        element: <RequirePermission resource={RESOURCE_CODE.TEST_CASE} permission={PERMISSION_CODE.UPDATE} />,
        children: [{ path: 'test-cases/:testCaseId/update', element: <TestCaseFormPage /> }],
    },
];
