import { createBrowserRouter, Navigate } from 'react-router';

import { AppShell } from './AppShell';
import { NotFoundState } from '../shared/components/NotFoundState';
import { RouteErrorState } from '../shared/components/RouteErrorState';

import { ANALYTICS_DASHBOARD_PATH } from '../features/analytics/analytics.constant';
import { analyticsRoutes } from '../features/analytics/analytics.routes';
import { authRoutes } from '../features/auth/auth.routes';
import { ProtectedRoute } from '../features/auth/components/ProtectedRoute';
import { projectRoutes, projectWorkspaceRoute } from '../features/project/project.routes';
import { suiteRunRoutes } from '../features/suite-run/suite-run.routes';
import { testCaseRoutes } from '../features/test-case/test-case.routes';
import { testExecutionRoutes } from '../features/test-execution/test-execution.routes';
import { testSuiteRoutes } from '../features/test-suite/test-suite.routes';
import { userRoutes } from '../features/user/user.routes';

export const router = createBrowserRouter([
    {
        errorElement: <RouteErrorState />,
        children: [
            // Public.
            ...authRoutes,
            // Everything else requires a signed-in user.
            {
                element: <ProtectedRoute />,
                children: [
                    {
                        element: <AppShell />,
                        children: [
                            // The dashboard opens first (ui-requirements §3).
                            { index: true, element: <Navigate to={ANALYTICS_DASHBOARD_PATH} replace /> },
                            ...analyticsRoutes,
                            ...projectRoutes,
                            // Features that live inside a project add their routes here.
                            projectWorkspaceRoute([
                                ...testCaseRoutes,
                                ...testSuiteRoutes,
                                ...testExecutionRoutes,
                                ...suiteRunRoutes,
                            ]),
                            ...userRoutes,
                            // Inside the layout so unknown URLs keep the sidebar/header for navigating back.
                            { path: '*', element: <NotFoundState /> },
                        ],
                    },
                ],
            },
        ],
    },
]);
