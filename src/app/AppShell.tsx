import { ProjectOutlined, TeamOutlined } from '@ant-design/icons';

import { AppLayout } from '../shared/components/layout/AppLayout';
import type { AppNavItem } from '../shared/components/layout/AppSidebar';
import { useAuth } from '../features/auth/auth.context';
import { PERMISSION_CODE, RESOURCE_CODE } from '../features/auth/auth.constant';
import { UserMenu } from '../features/auth/components/UserMenu';
import type { PermissionCode, ResourceCode } from '../features/auth/auth.type';

type GuardedNavItem = AppNavItem & {
    requires: { resource: ResourceCode; permission: PermissionCode };
};

const NAV_ITEMS: GuardedNavItem[] = [
    {
        key: 'projects',
        path: '/projects',
        icon: <ProjectOutlined />,
        labelKey: 'nav.projects',
        requires: { resource: RESOURCE_CODE.PROJECT, permission: PERMISSION_CODE.READ },
    },
    {
        key: 'users',
        path: '/users',
        icon: <TeamOutlined />,
        labelKey: 'nav.users',
        requires: { resource: RESOURCE_CODE.USER, permission: PERMISSION_CODE.READ },
    },
];

// App-level composition of the shared layout with the auth feature: only the nav items the signed-in user
// may open, and the user menu. Keeps shared/ free of feature imports.
export function AppShell() {
    const { can } = useAuth();

    const navItems = NAV_ITEMS.filter(({ requires }) => can(requires.resource, requires.permission));

    return <AppLayout navItems={navItems} headerExtra={<UserMenu />} />;
}
