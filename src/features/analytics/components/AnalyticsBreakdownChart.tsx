import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Flex, Segmented } from 'antd';

import { AnalyticsChart } from './AnalyticsChart';
import { ANALYTICS_BREAKDOWNS } from '../analytics.constant';
import type { AnalyticsBreakdown, AnalyticsType } from '../analytics.type';
import { describeCounts, useStatusSeries } from '../useStatusSeries';
import { EXECUTION_COUNT_KEYS } from '../../test-execution/test-execution.constant';
import { useHiddenSeries } from '../../../shared/hooks/useHiddenSeries';

const CHART_HEIGHT = 280;
const Y_AXIS_WIDTH = 40;
const MAX_BAR_SIZE = 48;
// The surface-colored gap between stacked segments.
const SEGMENT_GAP_WIDTH = 2;

type AnalyticsBreakdownChartProps = Pick<AnalyticsType, 'byPriority' | 'byType'>;

// Results and pending per test case priority, or per type (PRD Frontend Req §3: bar chart for pass/fail rates
// by priority or type) — stacked, every category shown (the API lists all, zeros included).
export function AnalyticsBreakdownChart({ byPriority, byType }: AnalyticsBreakdownChartProps) {
    const { t } = useTranslation('analytics');
    const { t: tTestCase } = useTranslation('testCase');
    const [breakdown, setBreakdown] = useState<AnalyticsBreakdown>('priority');
    const { series, axis, gridColor, surfaceColor } = useStatusSeries(EXECUTION_COUNT_KEYS);
    const { isHidden, toggle } = useHiddenSeries();

    // useMemo written explicitly (PRD Frontend Req §1: chart data transforms), although the React Compiler
    // would memoize it too: the API's rows with display names, in the API's order (LOW → CRITICAL).
    const rows = useMemo(() => (breakdown === 'priority'
        ? byPriority.map(({ priority, ...counts }) => ({ ...counts, name: tTestCase(`priority.${priority}`) }))
        : byType.map(({ type, ...counts }) => ({ ...counts, name: tTestCase(`type.${type}`) }))), [breakdown, byPriority, byType, tTestCase]);

    const summary = t('chart.breakdownSummary', {
        breakdown: t(`chart.${breakdown}`),
        parts: rows.map((row) => `${row.name}: ${describeCounts(series, row)}`).join('; '),
    });

    return (
        <Flex vertical gap="small">
            <Segmented
                aria-label={t('chart.breakdownToggle')}
                options={ANALYTICS_BREAKDOWNS.map((value) => ({ value, label: t(`chart.${value}`) }))}
                value={breakdown}
                onChange={setBreakdown}
            />
            <AnalyticsChart summary={summary} series={series} isHidden={isHidden} onToggle={toggle}>
                <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
                    <BarChart data={rows} maxBarSize={MAX_BAR_SIZE}>
                        <CartesianGrid vertical={false} stroke={gridColor} />
                        <XAxis dataKey="name" interval={0} {...axis} />
                        <YAxis allowDecimals={false} width={Y_AXIS_WIDTH} {...axis} />
                        <Tooltip />
                        {series.map(({ key, label, color }) => (
                            <Bar
                                key={key}
                                dataKey={key}
                                name={label}
                                stackId="status"
                                fill={color}
                                stroke={surfaceColor}
                                strokeWidth={SEGMENT_GAP_WIDTH}
                                hide={isHidden(key)}
                                isAnimationActive={false}
                            />
                        ))}
                    </BarChart>
                </ResponsiveContainer>
            </AnalyticsChart>
        </Flex>
    );
}
