import { MenuOutlined } from '@ant-design/icons';
import { Button, Grid, Layout } from 'antd';
import { useTranslation } from 'react-i18next';

import styles from './AppHeader.module.scss';

type AppHeaderProps = {
    onOpenSidebar: () => void;
};

export function AppHeader({ onOpenSidebar }: AppHeaderProps) {
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
        </Layout.Header>
    );
}
