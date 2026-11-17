import { Outlet } from 'react-router';

import { useAuth } from '../auth.context';
import type { PermissionCode, ResourceCode } from '../auth.type';
import { ForbiddenState } from '../../../shared/components/ForbiddenState';

type RequirePermissionProps = {
    resource: ResourceCode;
    permission: PermissionCode;
};

// Layout route around routes that need a permission: shows the 403 page instead of the route when the
// signed-in user lacks it (ui-requirements §2 rule 4). UX only — the API enforces it on every request.
export function RequirePermission({ resource, permission }: RequirePermissionProps) {
    const { can } = useAuth();

    return can(resource, permission) ? <Outlet /> : <ForbiddenState />;
}
