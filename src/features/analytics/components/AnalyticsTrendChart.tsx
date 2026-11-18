import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { AnalyticsChart } from './AnalyticsChart';
import type { AnalyticsType } from '../analytics.type';
import { describeCounts, useStatusSeries } from '../useStatusSeries';
import { EXECUTION_RESULT_COUNT_KEYS } from '../../test-execution/test-execution.constant';
import { formatCalendarDay, formatCalendarDayShort } from '../../../shared/format/date.format';
import { useHiddenSeries } from '../../../shared/hooks/useHiddenSeries';

const CHART_HEIGHT = 280;
const Y_AXIS_WIDTH = 40;
const TICK_GAP = 24;
const ACTIVE_DOT_RADIUS = 4;

type AnalyticsTrendChartProps = {
    trend: AnalyticsType['trend'];
};

// Results per day over the range (PRD Frontend Req §3: line chart for execution trends) — one line per result,
// one y-axis. Every day is a point, zeros included, so gaps in testing show as dips, not as missing days.
export function AnalyticsTrendChart({ trend }: AnalyticsTrendChartProps) {
    const { t } = useTranslation('analytics');
    const { series, axis, gridColor } = useStatusSeries(EXECUTION_RESULT_COUNT_KEYS);
    const { isHidden, toggle } = useHiddenSeries();

    // useMemo written explicitly (PRD Frontend Req §1: test statistics), although the React Compiler would
    // memoize it too: the range's totals per result, for the text summary.
    const totals = useMemo(() => Object.fromEntries(EXECUTION_RESULT_COUNT_KEYS.map((key) => [
        key,
        trend.reduce((sum, day) => sum + day[key], 0),
    ])), [trend]);

    const summary = t('chart.trendSummary', {
        from: trend.length > 0 ? formatCalendarDay(trend[0].date) : '',
        to: trend.length > 0 ? formatCalendarDay(trend[trend.length - 1].date) : '',
        parts: describeCounts(series, totals),
    });

    return (
        <AnalyticsChart summary={summary} series={series} isHidden={isHidden} onToggle={toggle}>
            <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
                <LineChart data={trend}>
                    <CartesianGrid vertical={false} stroke={gridColor} />
                    <XAxis dataKey="date" tickFormatter={formatCalendarDayShort} minTickGap={TICK_GAP} {...axis} />
                    <YAxis allowDecimals={false} width={Y_AXIS_WIDTH} {...axis} />
                    <Tooltip labelFormatter={(day) => (typeof day === 'string' ? formatCalendarDay(day) : day)} />
                    {series.map(({ key, label, color }) => (
                        <Line
                            key={key}
                            type="linear"
                            dataKey={key}
                            name={label}
                            stroke={color}
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: ACTIVE_DOT_RADIUS }}
                            hide={isHidden(key)}
                            isAnimationActive={false}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </AnalyticsChart>
    );
}
