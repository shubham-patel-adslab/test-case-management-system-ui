import { lazy, Suspense } from 'react';
import type { RouteObject } from 'react-router';

import { SET_PASSWORD_PATH, SIGN_IN_PATH } from './auth.constant';
import { QueryLoadingState } from '../../shared/components/QueryLoadingState';

const SignInPage = lazy(async () => {
    const module = await import('./pages/SignInPage');
    return { default: module.SignInPage };
});

const SetPasswordPage = lazy(async () => {
    const module = await import('./pages/SetPasswordPage');
    return { default: module.SetPasswordPage };
});

// Public routes, outside AppLayout — so each needs its own Suspense boundary for the lazy page.
export const authRoutes: RouteObject[] = [
    {
        path: SIGN_IN_PATH,
        element: (
            <Suspense fallback={<QueryLoadingState fullPage />}>
                <SignInPage />
            </Suspense>
        ),
    },
    {
        path: SET_PASSWORD_PATH,
        element: (
            <Suspense fallback={<QueryLoadingState fullPage />}>
                <SetPasswordPage />
            </Suspense>
        ),
    },
];
