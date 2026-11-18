import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Typography } from 'antd';

import { AnalyticsChart } from './AnalyticsChart';
import type { AnalyticsType } from '../analytics.type';
import { describeCounts, useStatusSeries } from '../useStatusSeries';
import { EXECUTION_COUNT_KEYS } from '../../test-execution/test-execution.constant';
import { formatFullName } from '../../../shared/format/name.format';
import { useHiddenSeries } from '../../../shared/hooks/useHiddenSeries';

const ROW_HEIGHT = 36;
const AXIS_HEIGHT = 40;
const NAME_AXIS_WIDTH = 140;
const MAX_BAR_SIZE = 20;
const SEGMENT_GAP_WIDTH = 2;

type AnalyticsTesterChartProps = {
    byTester: AnalyticsType['byTester'];
};

// Execution progress by tester (ui-requirements §4.5): what each person recorded in the range, by result,
// and the work still pending for them — one horizontal stacked bar per person, in the API's order (by name).
export function AnalyticsTesterChart({ byTester }: AnalyticsTesterChartProps) {
    const { t } = useTranslation('analytics');
    const { series, axis, gridColor, surfaceColor } = useStatusSeries(EXECUTION_COUNT_KEYS);
    const { isHidden, toggle } = useHiddenSeries();

    // useMemo written explicitly (PRD Frontend Req §1: chart data transforms), although the React Compiler
    // would memoize it too.
    const rows = useMemo(
        () => byTester.map(({ user, ...counts }) => ({ ...counts, name: formatFullName(user.firstName, user.lastName) })),
        [byTester],
    );

    if (rows.length === 0) {
        return <Typography.Text type="secondary">{t('chart.testerEmpty')}</Typography.Text>;
    }

    const summary = t('chart.testerSummary', {
        parts: rows.map((row) => `${row.name}: ${describeCounts(series, row)}`).join('; '),
    });

    return (
        <AnalyticsChart summary={summary} series={series} isHidden={isHidden} onToggle={toggle}>
            <ResponsiveContainer width="100%" height={rows.length * ROW_HEIGHT + AXIS_HEIGHT}>
                <BarChart data={rows} layout="vertical" maxBarSize={MAX_BAR_SIZE}>
                    <CartesianGrid horizontal={false} stroke={gridColor} />
                    <XAxis type="number" allowDecimals={false} {...axis} />
                    <YAxis type="category" dataKey="name" width={NAME_AXIS_WIDTH} {...axis} />
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
    );
}
