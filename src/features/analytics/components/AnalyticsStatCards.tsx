import { useTranslation } from 'react-i18next';
import { Card, Col, Progress, Row, Statistic, Typography } from 'antd';

import styles from './AnalyticsStatCards.module.scss';
import type { AnalyticsMetricsType, AnalyticsType } from '../analytics.type';
import { EXECUTION_COUNT_KEYS } from '../../test-execution/test-execution.constant';

const DISPLAY_LOCALE = 'en-US';
const percentFormat = new Intl.NumberFormat(DISPLAY_LOCALE, { style: 'percent', maximumFractionDigits: 1 });
const densityFormat = new Intl.NumberFormat(DISPLAY_LOCALE, { maximumFractionDigits: 2 });
const PERCENT = 100;

type AnalyticsStatCardsProps = {
    analytics: Pick<AnalyticsType, 'summary' | 'coverage' | 'defects'>;
    metrics: AnalyticsMetricsType;
};

// The execution summary and the ratios computed from it (ui-requirements §4.5): plain numbers, so they're
// readable without the charts.
export function AnalyticsStatCards({ analytics, metrics }: AnalyticsStatCardsProps) {
    const { t } = useTranslation('analytics');
    const { summary, coverage, defects } = analytics;
    const notAvailable = t('summary.notAvailable');

    return (
        <Row gutter={[16, 16]}>
            <Col xs={12} md={8} xl={4}>
                <Card size="small" className={styles['tb-analytics-stat-cards__card']}>
                    <Statistic title={t('summary.total')} value={summary.total} />
                    <Typography.Text type="secondary">{t('summary.totalHint')}</Typography.Text>
                </Card>
            </Col>
            {EXECUTION_COUNT_KEYS.map((key) => (
                <Col key={key} xs={12} md={8} xl={4}>
                    <Card size="small" className={styles['tb-analytics-stat-cards__card']}>
                        <Statistic title={t(`summary.${key}`)} value={summary[key]} />
                        {key === 'pending' && <Typography.Text type="secondary">{t('summary.pendingHint')}</Typography.Text>}
                    </Card>
                </Col>
            ))}
            <Col xs={24} md={8}>
                <Card size="small" className={styles['tb-analytics-stat-cards__card']}>
                    <Statistic
                        title={t('summary.passRate')}
                        value={metrics.passRate === null ? notAvailable : percentFormat.format(metrics.passRate)}
                    />
                    <Typography.Text type="secondary">{t('summary.passRateHint')}</Typography.Text>
                </Card>
            </Col>
            <Col xs={24} md={8}>
                <Card size="small" className={styles['tb-analytics-stat-cards__card']}>
                    <Statistic
                        title={t('summary.coverage')}
                        value={metrics.coverage === null ? notAvailable : percentFormat.format(metrics.coverage)}
                    />
                    <Progress percent={(metrics.coverage ?? 0) * PERCENT} showInfo={false} size="small" aria-hidden="true" />
                    <Typography.Text type="secondary">
                        {t('summary.coverageDetail', { executed: coverage.executedCases, total: coverage.totalCases })}
                    </Typography.Text>
                </Card>
            </Col>
            <Col xs={24} md={8}>
                <Card size="small" className={styles['tb-analytics-stat-cards__card']}>
                    <Statistic
                        title={t('summary.defectDensity')}
                        value={metrics.defectDensity === null ? notAvailable : densityFormat.format(metrics.defectDensity)}
                    />
                    <Typography.Text type="secondary">
                        {t('summary.defectDensityDetail', { defects: defects.total, executed: coverage.executedCases })}
                    </Typography.Text>
                </Card>
            </Col>
        </Row>
    );
}
