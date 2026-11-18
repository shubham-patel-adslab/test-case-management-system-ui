import { Flex } from 'antd';

import { getProjectNavItems, NAV_ITEMS, PROJECT_SWITCH_TARGETS, type GuardedNavItem } from './app-nav';
import { AppLayout } from '../shared/components/layout/AppLayout';
import type { AppNavGroup } from '../shared/components/layout/AppSidebar';
import { ThemeToggle } from '../shared/theme';
import { useAuth } from '../features/auth/auth.context';
import { PERMISSION_CODE, RESOURCE_CODE } from '../features/auth/auth.constant';
import { UserMenu } from '../features/auth/components/UserMenu';
import { CurrentProjectProvider } from '../features/project/components/CurrentProjectProvider';
import { ProjectSwitcher } from '../features/project/components/ProjectSwitcher';
import { useCurrentProjectContext } from '../features/project/current-project.context';

export function AppShell() {
    return (
        <CurrentProjectProvider>
            <AppShellLayout />
        </CurrentProjectProvider>
    );
}

// App-level composition of the shared layout with the features: only the nav items the signed-in user may
// open, the current project's section, the project switcher, the theme toggle and the user menu. Keeps shared/ free of
// feature imports.
function AppShellLayout() {
    const { can } = useAuth();
    const { projectQuery } = useCurrentProjectContext();

    const isAllowed = ({ requires }: GuardedNavItem) => can(requires.resource, requires.permission);
    const navItems = NAV_ITEMS.filter(isAllowed);

    // Shown once the project has loaded, titled with its name; a missing project shows no section.
    const project = projectQuery?.data;
    const projectNav: AppNavGroup | undefined = project && {
        key: 'project',
        title: project.name,
        items: getProjectNavItems(project.id).filter(isAllowed),
    };

    return (
        <AppLayout
            navItems={navItems}
            navGroup={projectNav}
            headerStart={can(RESOURCE_CODE.PROJECT, PERMISSION_CODE.READ) && <ProjectSwitcher sectionTargets={PROJECT_SWITCH_TARGETS} />}
            headerExtra={(
                <Flex gap="small" align="center">
                    <ThemeToggle />
                    <UserMenu />
                </Flex>
            )}
        />
    );
}
