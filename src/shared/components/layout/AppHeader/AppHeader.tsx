import { MenuOutlined } from '@ant-design/icons';
import { Button, Grid, Layout } from 'antd';
import { useTranslation } from 'react-i18next';

import styles from './AppHeader.module.scss';

type AppHeaderProps = {
    onOpenSidebar: () => void;
    // Right-aligned header content supplied by the app (e.g. the user menu), so this shared component
    // doesn't depend on any feature.
    extra?: React.ReactNode;
};

export function AppHeader({ onOpenSidebar, extra }: AppHeaderProps) {
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
            {extra && <div className={styles['tb-app-header__extra']}>{extra}</div>}
        </Layout.Header>
    );
}
