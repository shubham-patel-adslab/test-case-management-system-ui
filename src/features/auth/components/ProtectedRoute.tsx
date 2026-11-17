import { Navigate, Outlet, useLocation } from 'react-router';

import { useAuth } from '../auth.context';
import { RETURN_TO_PARAM, SIGN_IN_PATH } from '../auth.constant';

// Layout route around everything except /sign-in. Signed out → sign-in, remembering where to come back to.
export function ProtectedRoute() {
    const { session } = useAuth();
    const location = useLocation();

    if (!session) {
        const searchParams = new URLSearchParams({ [RETURN_TO_PARAM]: location.pathname + location.search });

        return <Navigate to={`${SIGN_IN_PATH}?${searchParams.toString()}`} replace />;
    }

    return <Outlet />;
}
