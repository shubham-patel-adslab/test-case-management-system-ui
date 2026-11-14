import { useTranslation } from 'react-i18next';
import { Spin } from 'antd';

import styles from './QueryLoadingState.module.scss';

export function QueryLoadingState() {
    const { t } = useTranslation('common');

    return (
        <div className={styles['tb-query-loading-state']}>
            <Spin size="large" description={t('queryState.loading')} />
        </div>
    );
}
