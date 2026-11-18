import { lazy } from 'react';
import type { RouteObject } from 'react-router';

import { RequirePermission } from '../auth/components/RequirePermission';
import { PERMISSION_CODE, RESOURCE_CODE } from '../auth/auth.constant';

const TestSuitePaginationPage = lazy(async () => {
    const module = await import('./pages/TestSuitePaginationPage');
    return { default: module.TestSuitePaginationPage };
});

const TestSuiteViewPage = lazy(async () => {
    const module = await import('./pages/TestSuiteViewPage');
    return { default: module.TestSuiteViewPage };
});

const TestSuiteFormPage = lazy(async () => {
    const module = await import('./pages/TestSuiteFormPage');
    return { default: module.TestSuiteFormPage };
});

// Relative to the project workspace route (/projects/:projectId); the app router passes them into
// projectWorkspaceRoute(). Each group sits behind the TEST_SUITE permission its page needs.
export const testSuiteRoutes: RouteObject[] = [
    {
        element: <RequirePermission resource={RESOURCE_CODE.TEST_SUITE} permission={PERMISSION_CODE.READ} />,
        children: [
            { path: 'test-suites', element: <TestSuitePaginationPage /> },
            { path: 'test-suites/:suiteId', element: <TestSuiteViewPage /> },
        ],
    },
    {
        element: <RequirePermission resource={RESOURCE_CODE.TEST_SUITE} permission={PERMISSION_CODE.CREATE} />,
        children: [{ path: 'test-suites/create', element: <TestSuiteFormPage /> }],
    },
    {
        element: <RequirePermission resource={RESOURCE_CODE.TEST_SUITE} permission={PERMISSION_CODE.UPDATE} />,
        children: [{ path: 'test-suites/:suiteId/update', element: <TestSuiteFormPage /> }],
    },
];
