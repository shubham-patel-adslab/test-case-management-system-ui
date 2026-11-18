import { useTranslation } from 'react-i18next';
import { Progress, Table, type TableColumnsType } from 'antd';

import styles from './CacheMetricsTable.module.scss';
import type { CacheMetricsEntryResponseDto } from '../metrics.response.dto';

const DISPLAY_LOCALE = 'en-US';
const countFormat = new Intl.NumberFormat(DISPLAY_LOCALE);
const percentFormat = new Intl.NumberFormat(DISPLAY_LOCALE, { style: 'percent', maximumFractionDigits: 1 });
const msFormat = new Intl.NumberFormat(DISPLAY_LOCALE, { maximumFractionDigits: 2 });
const speedUpFormat = new Intl.NumberFormat(DISPLAY_LOCALE, { maximumFractionDigits: 1 });
const PERCENT = 100;
const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3600;

// How many times faster a hit is than a miss; null until both have been measured.
function getHitSpeedUp({ averageHitMs, averageMissMs }: CacheMetricsEntryResponseDto): number | null {
    return averageHitMs && averageMissMs !== null ? averageMissMs / averageHitMs : null;
}

type CacheMetricsTableProps = {
    caches: CacheMetricsEntryResponseDto[];
    isLoading: boolean;
};

// One row per cache: how often it answered (hit rate) and how much time a hit saves over a miss.
export function CacheMetricsTable({ caches, isLoading }: CacheMetricsTableProps) {
    const { t } = useTranslation('metrics');
    const notAvailable = t('table.notAvailable');

    const cacheLabel = (name: string) => t(`cache.${name}`, { defaultValue: name });
    const formatMs = (value: number | null) => (value === null ? notAvailable : t('table.milliseconds', { value: msFormat.format(value) }));
    const formatTtl = (seconds: number) => (seconds % SECONDS_PER_HOUR === 0
        ? t('table.hours', { count: seconds / SECONDS_PER_HOUR })
        : t('table.minutes', { count: Math.round(seconds / SECONDS_PER_MINUTE) }));

    const columns: TableColumnsType<CacheMetricsEntryResponseDto> = [
        { title: t('table.cacheColumn'), key: 'name', render: (_, cache) => cacheLabel(cache.name) },
        { title: t('table.ttlColumn'), key: 'ttl', render: (_, cache) => formatTtl(cache.ttlSeconds) },
        {
            title: t('table.requestsGroup'),
            children: [
                { title: t('table.hitsColumn'), key: 'hits', align: 'right', render: (_, cache) => countFormat.format(cache.hits) },
                { title: t('table.missesColumn'), key: 'misses', align: 'right', render: (_, cache) => countFormat.format(cache.misses) },
                { title: t('table.bypassesColumn'), key: 'bypasses', align: 'right', render: (_, cache) => countFormat.format(cache.bypasses) },
                { title: t('table.errorsColumn'), key: 'errors', align: 'right', render: (_, cache) => countFormat.format(cache.errors) },
            ],
        },
        {
            title: t('table.hitRateColumn'),
            key: 'hitRate',
            render: (_, cache) => (cache.hitRate === null
                ? notAvailable
                : (
                    <Progress
                        className={styles['tb-cache-metrics-table__hit-rate']}
                        percent={cache.hitRate * PERCENT}
                        format={() => percentFormat.format(cache.hitRate ?? 0)}
                        size="small"
                        aria-label={t('table.hitRateLabel', { cache: cacheLabel(cache.name) })}
                    />
                )),
        },
        {
            title: t('table.timeGroup'),
            children: [
                { title: t('table.hitTimeColumn'), key: 'hitTime', align: 'right', render: (_, cache) => formatMs(cache.averageHitMs) },
                { title: t('table.missTimeColumn'), key: 'missTime', align: 'right', render: (_, cache) => formatMs(cache.averageMissMs) },
                { title: t('table.bypassTimeColumn'), key: 'bypassTime', align: 'right', render: (_, cache) => formatMs(cache.averageBypassMs) },
            ],
        },
        {
            title: t('table.speedUpColumn'),
            key: 'speedUp',
            align: 'right',
            render: (_, cache) => {
                const speedUp = getHitSpeedUp(cache);

                return speedUp === null ? notAvailable : t('table.times', { value: speedUpFormat.format(speedUp) });
            },
        },
    ];

    return (
        <Table<CacheMetricsEntryResponseDto>
            rowKey="name"
            columns={columns}
            dataSource={caches}
            loading={isLoading}
            bordered
            size="middle"
            pagination={false}
            scroll={{ x: 'max-content' }}
            locale={{ emptyText: t('table.empty') }}
        />
    );
}
