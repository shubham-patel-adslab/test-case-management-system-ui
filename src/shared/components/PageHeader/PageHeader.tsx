import { Flex, Typography } from 'antd';

import styles from './PageHeader.module.scss';

type PageHeaderProps = {
    title: React.ReactNode;
    // Page-level actions, right-aligned next to the title.
    actions?: React.ReactNode;
};

// The same header on every page: title and page actions on one row.
export function PageHeader({ title, actions }: PageHeaderProps) {
    return (
        <header className={styles['tb-page-header']}>
            <Flex justify="space-between" align="center" wrap gap="small">
                <Typography.Title level={3} className={styles['tb-page-header__title']}>{title}</Typography.Title>
                {actions && <Flex gap="small" wrap>{actions}</Flex>}
            </Flex>
        </header>
    );
}
