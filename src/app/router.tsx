import { createBrowserRouter, Navigate } from 'react-router';

import { AppLayout } from '../shared/components/layout/AppLayout';
import { NotFoundState } from '../shared/components/NotFoundState';
import { RouteErrorState } from '../shared/components/RouteErrorState';

import { projectRoutes } from '../features/project/project.routes';

export const router = createBrowserRouter([
    {
        element: <AppLayout />,
        errorElement: <RouteErrorState />,
        children: [
            { index: true, element: <Navigate to="/projects" replace /> },
            ...projectRoutes,
            // Inside the layout so unknown URLs keep the sidebar/header for navigating back.
            { path: '*', element: <NotFoundState /> },
        ]
    }
]);
