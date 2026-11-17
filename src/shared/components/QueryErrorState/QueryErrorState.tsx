import { useTranslation } from 'react-i18next';
import { Button, Result } from 'antd';

import styles from './QueryErrorState.module.scss';

type QueryErrorStateProps = {
    onRetry?: () => void;
    // Fill the whole viewport — only when nothing else (no header/sidebar) is on screen.
    fullPage?: boolean;
};

export function QueryErrorState({ onRetry, fullPage = false }: QueryErrorStateProps) {
    const { t } = useTranslation('common');

    const className = fullPage
        ? `${styles['tb-query-error-state']} ${styles['tb-query-error-state--full-page']}`
        : styles['tb-query-error-state'];

    return (
        <div className={className}>
            <Result
                status="error"
                title={t('queryState.loadError')}
                extra={onRetry && <Button onClick={onRetry}>{t('queryState.retry')}</Button>}
            />
        </div>
    );
}
