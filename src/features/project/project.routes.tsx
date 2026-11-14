import { lazy } from 'react';
import type { RouteObject } from 'react-router';

// React.lazy (not the router's own `lazy` route property) because the PRD explicitly requires
// React.lazy + Suspense for route code splitting; the Suspense boundary lives in AppLayout.
const ProjectPaginationPage = lazy(async () => {
    const module = await import('./pages/ProjectPaginationPage');
    return { default: module.ProjectPaginationPage };
});

export const projectRoutes: RouteObject[] = [
    {
        path: '/projects',
        element: <ProjectPaginationPage />,
    },
];
