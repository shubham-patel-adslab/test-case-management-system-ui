import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { Button, Result } from 'antd';

// Shown in place of a page the signed-in user has no permission for (ui-requirements §2 rule 4).
export function ForbiddenState() {
    const { t } = useTranslation('common');
    const navigate = useNavigate();

    return (
        <Result
            status="403"
            title={t('forbidden.title')}
            subTitle={t('forbidden.subTitle')}
            extra={
                <Button type="primary" onClick={() => void navigate('/')}>
                    {t('forbidden.backHome')}
                </Button>
            }
        />
    );
}
