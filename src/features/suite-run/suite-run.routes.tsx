import { lazy } from 'react';
import type { RouteObject } from 'react-router';

import { RequirePermission } from '../auth/components/RequirePermission';
import { PERMISSION_CODE, RESOURCE_CODE } from '../auth/auth.constant';

// Its own chunk, and with it Recharts: the chart library loads only when a report is opened.
const SuiteRunReportPage = lazy(async () => {
    const module = await import('./pages/SuiteRunReportPage');
    return { default: module.SuiteRunReportPage };
});

// Relative to the project workspace route (/projects/:projectId). Reports are readable by every role
// (TEST_EXECUTION READ, like the API).
export const suiteRunRoutes: RouteObject[] = [
    {
        element: <RequirePermission resource={RESOURCE_CODE.TEST_EXECUTION} permission={PERMISSION_CODE.READ} />,
        children: [{ path: 'suite-runs/:runId', element: <SuiteRunReportPage /> }],
    },
];
