import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { Button, Result } from 'antd';

export function NotFoundState() {
    const { t } = useTranslation('common');
    const navigate = useNavigate();

    return (
        <Result
            status="404"
            title={t('notFound.title')}
            subTitle={t('notFound.subTitle')}
            extra={
                <Button type="primary" onClick={() => void navigate('/')}>
                    {t('notFound.backHome')}
                </Button>
            }
        />
    );
}
