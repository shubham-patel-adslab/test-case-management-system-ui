import { Suspense, useState } from 'react';
import { Grid, Layout } from 'antd';
import { Outlet } from 'react-router';

import { AppHeader } from '../AppHeader';
import { AppSidebar, type AppNavGroup, type AppNavItem } from '../AppSidebar';
import { QueryLoadingState } from '../../QueryLoadingState';
import styles from './AppLayout.module.scss';

type AppLayoutProps = {
    // Passed through to the sidebar.
    navItems: AppNavItem[];
    navGroup?: AppNavGroup;
    // Passed through to AppHeader's left- and right-hand slots.
    headerStart?: React.ReactNode;
    headerExtra?: React.ReactNode;
};

export function AppLayout({ navItems, navGroup, headerStart, headerExtra }: AppLayoutProps) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const isMobile = !Grid.useBreakpoint().lg;

    // Fixed viewport-height shell (sidebar + header pinned, only content scrolls) is a
    // desktop pattern — on mobile the sidebar is a Drawer overlay instead, so the page keeps
    // its normal, natural scroll rather than being forced into a contained inner region.
    const layoutClassName = isMobile
        ? styles['tb-app-layout']
        : `${styles['tb-app-layout']} ${styles['tb-app-layout--fixed']}`;

    return (
        <Layout className={layoutClassName}>
            <AppSidebar collapsed={sidebarCollapsed} onCollapse={setSidebarCollapsed} navItems={navItems} navGroup={navGroup} />
            <Layout className={styles['tb-app-layout__main']}>
                <AppHeader onOpenSidebar={() => setSidebarCollapsed(false)} start={headerStart} extra={headerExtra} />
                <Layout.Content className={styles['tb-app-layout__content']}>
                    {/* Inside Content, so sidebar + header stay visible while a lazy page chunk loads. */}
                    <Suspense fallback={<QueryLoadingState />}>
                        <Outlet />
                    </Suspense>
                </Layout.Content>
            </Layout>
        </Layout>
    );
}
