import { useTranslation } from 'react-i18next';
import { Spin } from 'antd';

import styles from './QueryLoadingState.module.scss';

type QueryLoadingStateProps = {
    // Fill the whole viewport — only when nothing else (no header/sidebar) is on screen.
    fullPage?: boolean;
};

export function QueryLoadingState({ fullPage = false }: QueryLoadingStateProps) {
    const { t } = useTranslation('common');

    const className = fullPage
        ? `${styles['tb-query-loading-state']} ${styles['tb-query-loading-state--full-page']}`
        : styles['tb-query-loading-state'];

    return (
        <div className={className}>
            <Spin size="large" description={t('queryState.loading')} />
        </div>
    );
}
