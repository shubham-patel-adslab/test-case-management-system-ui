import { lazy } from 'react';
import type { RouteObject } from 'react-router';

import { RequirePermission } from '../auth/components/RequirePermission';
import { PERMISSION_CODE, RESOURCE_CODE } from '../auth/auth.constant';

const ProjectPaginationPage = lazy(async () => {
    const module = await import('./pages/ProjectPaginationPage');
    return { default: module.ProjectPaginationPage };
});

const ProjectViewPage = lazy(async () => {
    const module = await import('./pages/ProjectViewPage');
    return { default: module.ProjectViewPage };
});

const ProjectFormPage = lazy(async () => {
    const module = await import('./pages/ProjectFormPage');
    return { default: module.ProjectFormPage };
});

// Each group sits behind the PROJECT permission its page needs; without it the route shows the 403 page.
export const projectRoutes: RouteObject[] = [
    {
        element: <RequirePermission resource={RESOURCE_CODE.PROJECT} permission={PERMISSION_CODE.READ} />,
        children: [
            { path: '/projects', element: <ProjectPaginationPage /> },
            { path: '/projects/:projectId', element: <ProjectViewPage /> },
        ],
    },
    {
        element: <RequirePermission resource={RESOURCE_CODE.PROJECT} permission={PERMISSION_CODE.CREATE} />,
        children: [{ path: '/projects/create', element: <ProjectFormPage /> }],
    },
    {
        element: <RequirePermission resource={RESOURCE_CODE.PROJECT} permission={PERMISSION_CODE.UPDATE} />,
        children: [{ path: '/projects/:projectId/update', element: <ProjectFormPage /> }],
    },
];
