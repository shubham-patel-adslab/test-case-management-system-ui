import { useMemo } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';
import { Button, Card, Col, Empty, Flex, Result, Row, Typography } from 'antd';

import { AnalyticsBreakdownChart } from '../components/AnalyticsBreakdownChart';
import { AnalyticsProjectFilter } from '../components/AnalyticsProjectFilter';
import { AnalyticsRangeFilter } from '../components/AnalyticsRangeFilter';
import { AnalyticsStatCards } from '../components/AnalyticsStatCards';
import { AnalyticsTesterChart } from '../components/AnalyticsTesterChart';
import { AnalyticsTrendChart } from '../components/AnalyticsTrendChart';
import { getAnalytics } from '../analytics.api';
import { ANALYTICS_PROJECT_PARAM } from '../analytics.constant';
import { toAnalytics } from '../analytics.mapper';
import { toAnalyticsMetrics } from '../analytics.metrics';
import { analyticsQueryKey } from '../analytics.query';
import { getViewerTimeZone, getViewerToday, parseAnalyticsRange, setAnalyticsRangeParams, toAnalyticsDays } from '../analytics.range';
import type { AnalyticsRequestDto } from '../analytics.request.dto';
import type { AnalyticsRangeType } from '../analytics.type';
import { ExecutionStatusPie } from '../../test-execution/components/ExecutionStatusPie';
import { API_ERROR_CODE, getApiErrorCode } from '../../../app/api-error';
import { PageHeader } from '../../../shared/components/PageHeader';
import { QueryErrorState } from '../../../shared/components/QueryErrorState';
import { QueryLoadingState } from '../../../shared/components/QueryLoadingState';
import { formatDateTime } from '../../../shared/format/date.format';

// The URL's project filter; anything but a positive integer means all projects.
function parseProjectId(searchParams: URLSearchParams): number | null {
    const value = Number(searchParams.get(ANALYTICS_PROJECT_PARAM));

    return Number.isInteger(value) && value > 0 ? value : null;
}

// The dashboard (PRD Features §5, ui-requirements §4.5): every project the user may read, or one picked in the
// filter; one request for every widget, over the chosen days in the viewer's time zone. Every role may see it.
export function DashboardPage() {
    const { t } = useTranslation('analytics');
    const [searchParams, setSearchParams] = useSearchParams();

    const today = getViewerToday();
    const range = parseAnalyticsRange(searchParams, today);
    const projectId = parseProjectId(searchParams);
    const request: AnalyticsRequestDto = {
        ...toAnalyticsDays(range, today),
        timeZone: getViewerTimeZone(),
        ...(projectId === null ? {} : { projectId }),
    };

    const analyticsQuery = useQuery({
        queryKey: analyticsQueryKey(request),
        queryFn: ({ signal }) => getAnalytics(request, signal),
        // The last range stays on screen while the next one loads.
        placeholderData: keepPreviousData,
        select: toAnalytics,
    });

    const analytics = analyticsQuery.data;

    // useMemo written explicitly (PRD Frontend Req §1: pass rates, coverage), although the React Compiler
    // would memoize it too. Recomputed only when a new response arrives.
    const metrics = useMemo(() => (analytics ? toAnalyticsMetrics(analytics) : undefined), [analytics]);

    const handleRangeChange = (nextRange: AnalyticsRangeType) => {
        setSearchParams((prev) => setAnalyticsRangeParams(prev, nextRange));
    };

    // The days stay as they are; all projects leaves no param (one URL per filter).
    const handleProjectChange = (nextProjectId: number | null) => {
        setSearchParams((prev) => {
            if (nextProjectId === null) {
                prev.delete(ANALYTICS_PROJECT_PARAM);
            } else {
                prev.set(ANALYTICS_PROJECT_PARAM, String(nextProjectId));
            }

            return prev;
        });
    };

    const header = (
        <PageHeader
            title={t('page.title')}
            actions={(
                <Flex gap="small" wrap align="center">
                    <AnalyticsProjectFilter projectId={projectId} onChange={handleProjectChange} />
                    <AnalyticsRangeFilter range={range} today={today} onChange={handleRangeChange} />
                </Flex>
            )}
        />
    );

    // A filtered project outside the user's scope (an old link, a team they left): the API answers 404.
    if (getApiErrorCode(analyticsQuery.error) === API_ERROR_CODE.NOT_FOUND) {
        return (
            <>
                {header}
                <Result
                    status="404"
                    title={t('project.unavailableTitle')}
                    subTitle={t('project.unavailableHint')}
                    extra={<Button type="primary" onClick={() => handleProjectChange(null)}>{t('project.showAll')}</Button>}
                />
            </>
        );
    }

    if (analyticsQuery.isError) {
        return (
            <>
                {header}
                <QueryErrorState onRetry={() => void analyticsQuery.refetch()} />
            </>
        );
    }

    if (!analytics || !metrics) {
        return (
            <>
                {header}
                <QueryLoadingState />
            </>
        );
    }

    const updated = t('page.updated', { date: formatDateTime(analytics.generatedAt), timeZone: analytics.range.timeZone });

    // Nothing recorded on these days and nothing waiting: guidance instead of empty charts.
    if (analytics.summary.total === 0) {
        return (
            <>
                {header}
                <Empty description={(
                    <Flex vertical gap={4}>
                        <Typography.Text strong>{t('empty.title')}</Typography.Text>
                        <Typography.Text type="secondary">{t('empty.hint')}</Typography.Text>
                    </Flex>
                )}
                />
            </>
        );
    }

    return (
        <>
            {header}
            <Flex vertical gap="middle">
                <Typography.Text type="secondary">{updated}</Typography.Text>
                <AnalyticsStatCards analytics={analytics} metrics={metrics} />
                <Row gutter={[16, 16]}>
                    <Col xs={24} xl={8}>
                        <Card size="small" title={t('chart.statusTitle')}>
                            <ExecutionStatusPie
                                counts={analytics.summary}
                                summaryLabel={t('chart.statusSummary', { count: analytics.summary.total })}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} xl={16}>
                        <Card size="small" title={t('chart.trendTitle')}>
                            <AnalyticsTrendChart trend={analytics.trend} />
                        </Card>
                    </Col>
                    <Col xs={24} xl={12}>
                        <Card size="small" title={t('chart.breakdownTitle')}>
                            <AnalyticsBreakdownChart byPriority={analytics.byPriority} byType={analytics.byType} />
                        </Card>
                    </Col>
                    <Col xs={24} xl={12}>
                        <Card size="small" title={t('chart.testerTitle')}>
                            <AnalyticsTesterChart byTester={analytics.byTester} />
                        </Card>
                    </Col>
                </Row>
            </Flex>
        </>
    );
}
