import { FileTextOutlined, FolderOutlined, InfoCircleOutlined, PlayCircleOutlined, ProjectOutlined, TeamOutlined } from '@ant-design/icons';

import type { AppNavItem } from '../shared/components/layout/AppSidebar';
import { PERMISSION_CODE, RESOURCE_CODE } from '../features/auth/auth.constant';
import type { PermissionCode, ResourceCode } from '../features/auth/auth.type';

// The app's navigation data; AppShell filters it by permission and hands it to the shared layout.

export type GuardedNavItem = AppNavItem & {
    requires: { resource: ResourceCode; permission: PermissionCode };
};

export const NAV_ITEMS: GuardedNavItem[] = [
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

type ProjectSection = Omit<GuardedNavItem, 'path' | 'matchPaths'> & {
    // Path below /projects/:projectId ('' = the project's own page).
    segment: string;
    // Other segments whose pages belong to this section (highlighted with it, switched to it).
    extraSegments?: string[];
};

// The pages inside the current project; each feature adds its section as it's built.
const PROJECT_SECTIONS: ProjectSection[] = [
    {
        key: 'project-overview',
        segment: '',
        icon: <InfoCircleOutlined />,
        labelKey: 'nav.projectOverview',
        requires: { resource: RESOURCE_CODE.PROJECT, permission: PERMISSION_CODE.READ },
    },
    {
        key: 'test-cases',
        segment: 'test-cases',
        icon: <FileTextOutlined />,
        labelKey: 'nav.testCases',
        requires: { resource: RESOURCE_CODE.TEST_CASE, permission: PERMISSION_CODE.READ },
    },
    {
        key: 'test-suites',
        segment: 'test-suites',
        // Suite run reports live at /projects/:id/suite-runs/:runId — flat, because a run outlives its suite.
        extraSegments: ['suite-runs'],
        icon: <FolderOutlined />,
        labelKey: 'nav.testSuites',
        requires: { resource: RESOURCE_CODE.TEST_SUITE, permission: PERMISSION_CODE.READ },
    },
    {
        key: 'executions',
        segment: 'executions',
        icon: <PlayCircleOutlined />,
        labelKey: 'nav.executions',
        requires: { resource: RESOURCE_CODE.TEST_EXECUTION, permission: PERMISSION_CODE.READ },
    },
];

// Switching project keeps the user in the same section: page segment → the section's list in the other
// project (a suite run report → its test suites; an item's id means nothing there).
export const PROJECT_SWITCH_TARGETS: ReadonlyMap<string, string> = new Map(PROJECT_SECTIONS
    .filter(({ segment }) => segment)
    .flatMap(({ segment, extraSegments = [] }) => [segment, ...extraSegments].map((owned) => [owned, segment] as const)));

export function getProjectNavItems(projectId: number): GuardedNavItem[] {
    const toPath = (segment: string) => (segment ? `/projects/${projectId}/${segment}` : `/projects/${projectId}`);

    return PROJECT_SECTIONS.map(({ segment, extraSegments, ...item }) => ({
        ...item,
        path: toPath(segment),
        matchPaths: extraSegments?.map(toPath),
    }));
}
