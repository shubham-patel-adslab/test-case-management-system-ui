import { lazy } from 'react';
import type { RouteObject } from 'react-router';

import { CACHE_METRICS_PATH } from './metrics.constant';
import { RequirePermission } from '../auth/components/RequirePermission';
import { PERMISSION_CODE, RESOURCE_CODE } from '../auth/auth.constant';

const CacheMetricsPage = lazy(async () => {
    const module = await import('./pages/CacheMetricsPage');
    return { default: module.CacheMetricsPage };
});

// Admins only (METRICS READ); without it the route shows the 403 page.
export const metricsRoutes: RouteObject[] = [
    {
        element: <RequirePermission resource={RESOURCE_CODE.METRICS} permission={PERMISSION_CODE.READ} />,
        children: [{ path: CACHE_METRICS_PATH, element: <CacheMetricsPage /> }],
    },
];
