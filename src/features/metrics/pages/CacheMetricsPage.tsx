import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Alert, Button, Flex, Tag, Typography } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';

import { CacheMetricsTable } from '../components/CacheMetricsTable';
import { getCacheMetrics } from '../metrics.api';
import { CACHE_METRICS_QUERY_KEY } from '../metrics.query';
import { PageHeader } from '../../../shared/components/PageHeader';
import { QueryErrorState } from '../../../shared/components/QueryErrorState';
import { QueryLoadingState } from '../../../shared/components/QueryLoadingState';
import { formatDateTime } from '../../../shared/format/date.format';

// ioredis' state when connected.
const REDIS_READY = 'ready';

// The API's Redis cache at work (PRD Live Demo: "performance metrics showing caching effectiveness"): per cache,
// how often it answered and how much faster a cached answer is. Admins only (METRICS READ).
export function CacheMetricsPage() {
    const { t } = useTranslation('metrics');

    const metricsQuery = useQuery({
        queryKey: CACHE_METRICS_QUERY_KEY,
        queryFn: ({ signal }) => getCacheMetrics(signal),
    });

    const metrics = metricsQuery.data;

    const header = (
        <PageHeader
            title={t('page.title')}
            actions={(
                <Button icon={<ReloadOutlined />} loading={metricsQuery.isFetching} onClick={() => void metricsQuery.refetch()}>
                    {t('page.refresh')}
                </Button>
            )}
        />
    );

    if (metricsQuery.isError && !metrics) {
        return (
            <>
                {header}
                <QueryErrorState onRetry={() => void metricsQuery.refetch()} />
            </>
        );
    }

    if (!metrics) {
        return (
            <>
                {header}
                <QueryLoadingState />
            </>
        );
    }

    const isRedisReady = metrics.redisStatus === REDIS_READY;

    return (
        <>
            {header}
            <Flex vertical gap="middle">
                <Flex gap="small" wrap align="center">
                    <Typography.Text>{t('status.caching')}</Typography.Text>
                    <Tag color={metrics.enabled ? 'success' : 'default'}>{metrics.enabled ? t('status.on') : t('status.off')}</Tag>
                    {metrics.enabled && (
                        <>
                            <Typography.Text>{t('status.redis')}</Typography.Text>
                            <Tag color={isRedisReady ? 'success' : 'warning'}>{metrics.redisStatus}</Tag>
                        </>
                    )}
                </Flex>

                {!metrics.enabled && <Alert type="info" showIcon title={t('status.offHint')} />}
                {metrics.enabled && !isRedisReady && (
                    <Alert type="warning" showIcon title={t('status.redisDownHint', { status: metrics.redisStatus })} />
                )}
                {metrics.lastError && (
                    <Alert
                        type="warning"
                        showIcon
                        title={t('status.lastError', { date: formatDateTime(metrics.lastError.at) })}
                        description={metrics.lastError.message}
                    />
                )}

                <CacheMetricsTable caches={metrics.caches} isLoading={metricsQuery.isFetching} />

                <Typography.Text type="secondary">{t('page.since', { date: formatDateTime(metrics.since) })}</Typography.Text>
            </Flex>
        </>
    );
}
