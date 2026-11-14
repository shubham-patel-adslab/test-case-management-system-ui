import { useLayoutEffect } from 'react';
import { MenuFoldOutlined, MenuUnfoldOutlined, ProjectOutlined } from '@ant-design/icons';
import { Button, Drawer, Grid, Layout, Menu, theme } from 'antd';
import type { MenuProps } from 'antd';
import { Link, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';

import styles from './AppSidebar.module.scss';

const NAV_ITEMS: { key: string; path: string; icon: React.ReactNode; labelKey: string }[] = [
    { key: 'projects', path: '/projects', icon: <ProjectOutlined />, labelKey: 'nav.projects' },
];

type AppSidebarProps = {
    collapsed: boolean;
    onCollapse: (collapsed: boolean) => void;
};

export function AppSidebar({ collapsed, onCollapse }: AppSidebarProps) {
    const { t } = useTranslation('common');
    const location = useLocation();
    const { token } = theme.useToken();
    const isMobile = !Grid.useBreakpoint().lg;

    // Mirrors antd's own Sider breakpoint behavior (auto-collapse entering mobile, auto-expand
    // leaving it) now that mobile renders a Drawer instead of Sider, which has no breakpoint of
    // its own. useLayoutEffect (not useEffect) avoids a flash of the drawer being open on mobile
    // before this correction runs.
    useLayoutEffect(() => {
        onCollapse(isMobile);
    }, [isMobile, onCollapse]);

    const selectedKey = NAV_ITEMS.find((item) => location.pathname.startsWith(item.path))?.key;

    const items: MenuProps['items'] = NAV_ITEMS.map((item) => ({
        key: item.key,
        icon: item.icon,
        label: <Link to={item.path}>{t(item.labelKey)}</Link>
    }));

    const appName = t('appName');

    const logoMark = (
        <span className={styles['tb-app-sidebar__logo-mark']}>
            {appName.charAt(0)}
        </span>
    );

    // Collapsed rail (desktop only): shows just the logo mark; hovering swaps it for the
    // expand icon in place, since there's no room for a separate always-visible button.
    const brand = !collapsed || isMobile ? (
        <div className={styles['tb-app-sidebar__brand']}>
            <Link to="/" className={styles['tb-app-sidebar__logo']}>
                {logoMark}
                <span className={styles['tb-app-sidebar__logo-text']}>{appName}</span>
            </Link>
            <Button
                type="text"
                icon={<MenuFoldOutlined />}
                onClick={() => onCollapse(true)}
                aria-label={t('nav.toggleSidebar')}
            />
        </div>
    ) : (
        <Button
            type="text"
            block
            className={styles['tb-app-sidebar__logo-toggle']}
            onClick={() => onCollapse(false)}
            aria-label={t('nav.toggleSidebar')}
        >
            {logoMark}
            <span className={styles['tb-app-sidebar__expand-icon']}>
                <MenuUnfoldOutlined />
            </span>
        </Button>
    );

    const menu = (
        <Menu
            className={styles['tb-app-sidebar__menu']}
            mode="inline"
            inlineCollapsed={!isMobile && collapsed}
            items={items}
            selectedKeys={selectedKey ? [selectedKey] : []}
            onClick={isMobile ? () => onCollapse(true) : undefined}
        />
    );

    // Same fixed height as the brand header, pinned to the bottom — menu is the only part
    // of the sidebar that scrolls, in the space between this and the header.
    const footer = (
        <div className={styles['tb-app-sidebar__footer']}>
            {t('sidebarFooterText')}
        </div>
    );

    // The only values genuinely known at runtime (antd's current theme tokens) — exposed as
    // CSS custom properties on the shared ancestor so every actual style declaration still
    // lives in AppSidebar.module.scss, per frontend.md's inline-styling rule.
    const themeVars = {
        '--tb-sidebar-divider-color': token.colorBorderSecondary,
        '--tb-sidebar-badge-bg': token.colorPrimary,
        '--tb-sidebar-badge-color': token.colorTextLightSolid,
    } as React.CSSProperties;

    const content = (
        <div className={styles['tb-app-sidebar__inner']} style={themeVars}>
            {brand}
            {menu}
            {footer}
        </div>
    );

    if (isMobile) {
        return (
            <Drawer placement="left" closable={false} open={!collapsed} onClose={() => onCollapse(true)} size={200} styles={{ body: { padding: 0 } }}>
                {content}
            </Drawer>
        );
    }

    return (
        <Layout.Sider
            className={styles['tb-app-sidebar']}
            theme="light"
            trigger={null}
            collapsed={collapsed}
        >
            {content}
        </Layout.Sider>
    );
}
