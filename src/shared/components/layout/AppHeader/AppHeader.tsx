import { MenuOutlined } from '@ant-design/icons';
import { Button, Grid, Layout } from 'antd';
import { useTranslation } from 'react-i18next';

import styles from './AppHeader.module.scss';

type AppHeaderProps = {
    onOpenSidebar: () => void;
    // Header content supplied by the app, so this shared component doesn't depend on any feature: `start`
    // on the left (e.g. the project switcher), `extra` right-aligned (e.g. the user menu).
    start?: React.ReactNode;
    extra?: React.ReactNode;
};

export function AppHeader({ onOpenSidebar, start, extra }: AppHeaderProps) {
    const { t } = useTranslation('common');
    const isMobile = !Grid.useBreakpoint().lg;

    return (
        <Layout.Header className={styles['tb-app-header']}>
            {isMobile && (
                <Button
                    type="text"
                    icon={<MenuOutlined />}
                    onClick={onOpenSidebar}
                    aria-label={t('nav.openSidebar')}
                />
            )}
            {start && <div className={styles['tb-app-header__start']}>{start}</div>}
            {extra && <div className={styles['tb-app-header__extra']}>{extra}</div>}
        </Layout.Header>
    );
}
