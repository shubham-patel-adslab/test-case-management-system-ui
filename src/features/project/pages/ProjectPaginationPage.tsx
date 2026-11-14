import { useTranslation } from 'react-i18next';
import { Typography } from 'antd';

export function ProjectPaginationPage() {
    const { t } = useTranslation('project');

    return (
        <Typography.Title level={3}>{t('page.paginationTitle')}</Typography.Title>
    );
}
