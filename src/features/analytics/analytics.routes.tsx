import { lazy } from 'react';
import type { RouteObject } from 'react-router';

import { ANALYTICS_DASHBOARD_PATH } from './analytics.constant';
import { RequirePermission } from '../auth/components/RequirePermission';
import { PERMISSION_CODE, RESOURCE_CODE } from '../auth/auth.constant';

// Its own chunk, and with it Recharts: the chart library loads only when the dashboard is opened.
const DashboardPage = lazy(async () => {
    const module = await import('./pages/DashboardPage');
    return { default: module.DashboardPage };
});

// Top-level, not inside a project: the dashboard spans projects. Every role may see it (ANALYTICS READ).
export const analyticsRoutes: RouteObject[] = [
    {
        element: <RequirePermission resource={RESOURCE_CODE.ANALYTICS} permission={PERMISSION_CODE.READ} />,
        children: [{ path: ANALYTICS_DASHBOARD_PATH, element: <DashboardPage /> }],
    },
];
