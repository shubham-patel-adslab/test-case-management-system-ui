import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouteError } from 'react-router';
import { Button, Result } from 'antd';

import styles from './RouteErrorState.module.scss';

// Router-level error boundary: catches render/loader errors anywhere under the route it's
// attached to, replacing React Router's default developer error screen.
export function RouteErrorState() {
    const { t } = useTranslation('common');
    const error = useRouteError();

    useEffect(() => {
        console.error('Unhandled route error:', error);
    }, [error]);

    return (
        <div className={styles['ads-route-error-state']}>
            <Result
                status="error"
                title={t('routeError.title')}
                subTitle={t('routeError.subTitle')}
                extra={
                    <Button type="primary" onClick={() => window.location.reload()}>
                        {t('routeError.reload')}
                    </Button>
                }
            />
        </div>
    );
}
