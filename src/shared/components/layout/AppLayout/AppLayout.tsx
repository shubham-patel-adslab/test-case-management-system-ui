import { Suspense, useState } from 'react';
import { Grid, Layout } from 'antd';
import { Outlet } from 'react-router';

import { AppHeader } from '../AppHeader';
import { AppSidebar } from '../AppSidebar';
import { QueryLoadingState } from '../../QueryLoadingState';
import styles from './AppLayout.module.scss';

export function AppLayout() {
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
            <AppSidebar collapsed={sidebarCollapsed} onCollapse={setSidebarCollapsed} />
            <Layout className={styles['tb-app-layout__main']}>
                <AppHeader onOpenSidebar={() => setSidebarCollapsed(false)} />
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
