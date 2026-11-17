import { lazy } from 'react';
import type { RouteObject } from 'react-router';

import { RequirePermission } from '../auth/components/RequirePermission';
import { PERMISSION_CODE, RESOURCE_CODE } from '../auth/auth.constant';

const UserPaginationPage = lazy(async () => {
    const module = await import('./pages/UserPaginationPage');
    return { default: module.UserPaginationPage };
});

const UserViewPage = lazy(async () => {
    const module = await import('./pages/UserViewPage');
    return { default: module.UserViewPage };
});

const UserFormPage = lazy(async () => {
    const module = await import('./pages/UserFormPage');
    return { default: module.UserFormPage };
});

// Each group sits behind the USER permission its page needs (only ADMIN holds them); without it the
// route shows the 403 page.
export const userRoutes: RouteObject[] = [
    {
        element: <RequirePermission resource={RESOURCE_CODE.USER} permission={PERMISSION_CODE.READ} />,
        children: [
            { path: '/users', element: <UserPaginationPage /> },
            { path: '/users/:userId', element: <UserViewPage /> },
        ],
    },
    {
        element: <RequirePermission resource={RESOURCE_CODE.USER} permission={PERMISSION_CODE.CREATE} />,
        children: [{ path: '/users/create', element: <UserFormPage /> }],
    },
    {
        element: <RequirePermission resource={RESOURCE_CODE.USER} permission={PERMISSION_CODE.UPDATE} />,
        children: [{ path: '/users/:userId/update', element: <UserFormPage /> }],
    },
];
