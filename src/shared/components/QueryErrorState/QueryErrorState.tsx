import { useTranslation } from 'react-i18next';
import { Button, Result } from 'antd';

import styles from './QueryErrorState.module.scss';

type QueryErrorStateProps = {
    onRetry?: () => void;
};

export function QueryErrorState({ onRetry }: QueryErrorStateProps) {
    const { t } = useTranslation('common');

    return (
        <div className={styles['tb-query-error-state']}>
            <Result
                status="error"
                title={t('queryState.loadError')}
                extra={onRetry && <Button onClick={onRetry}>{t('queryState.retry')}</Button>}
            />
        </div>
    );
}
