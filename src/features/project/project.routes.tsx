import { lazy } from 'react';
import type { RouteObject } from 'react-router';

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

export const projectRoutes: RouteObject[] = [
    { path: '/projects', element: <ProjectPaginationPage /> },
    { path: '/projects/create', element: <ProjectFormPage /> },
    { path: '/projects/:projectId', element: <ProjectViewPage /> },
    { path: '/projects/:projectId/update', element: <ProjectFormPage /> },
];
