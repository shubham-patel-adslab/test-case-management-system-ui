import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Flex, Typography, theme } from 'antd';

import styles from './ExecutionStatusPie.module.scss';
import { EXECUTION_COUNT_KEYS } from '../test-execution.constant';
import type { ExecutionCountKey } from '../test-execution.type';
import { useExecutionStatusColors } from '../useExecutionStatusColors';
import { ChartLegend } from '../../../shared/components/ChartLegend';
import { useHiddenSeries } from '../../../shared/hooks/useHiddenSeries';

const CHART_HEIGHT = 240;
const INNER_RADIUS = 55;
const OUTER_RADIUS = 90;
// The surface-colored gap between slices.
const SLICE_GAP_WIDTH = 2;

type ExecutionStatusPieProps = {
    counts: Record<ExecutionCountKey, number>;
    // What the chart shows, for its text summary, e.g. "Status of the run's 12 executions".
    summaryLabel: string;
};

// A status distribution as a donut (PRD Frontend Req §3: pie chart for test status distribution) — the suite
// run report and the dashboard. The legend switches slices off; screen readers get the numbers as text.
export function ExecutionStatusPie({ counts, summaryLabel }: ExecutionStatusPieProps) {
    const { t } = useTranslation('testExecution');
    const { token } = theme.useToken();
    const colors = useExecutionStatusColors();
    const { isHidden, toggle } = useHiddenSeries();

    // useMemo written explicitly (PRD Frontend Req §1: chart data transforms), although the React Compiler
    // would memoize it too. Empty statuses are left out of the chart and its legend.
    const slices = useMemo(
        () => EXECUTION_COUNT_KEYS
            .map((key) => ({ key, name: t(`count.${key}`), value: counts[key], color: colors[key] }))
            .filter((slice) => slice.value > 0),
        [counts, colors, t],
    );

    const summary = `${summaryLabel}: ${slices.map((slice) => `${slice.name} ${slice.value}`).join(', ') || t('statusPie.empty')}`;
    const shownSlices = slices.filter((slice) => !isHidden(slice.key));

    return (
        <figure className={styles['tb-execution-status-pie']}>
            <Flex vertical gap="small">
                <div role="img" aria-label={summary}>
                    <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
                        <PieChart>
                            <Pie
                                data={shownSlices}
                                dataKey="value"
                                nameKey="name"
                                innerRadius={INNER_RADIUS}
                                outerRadius={OUTER_RADIUS}
                                stroke={token.colorBgContainer}
                                strokeWidth={SLICE_GAP_WIDTH}
                                isAnimationActive={false}
                            >
                                {shownSlices.map((slice) => <Cell key={slice.key} fill={slice.color} />)}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <ChartLegend
                    label={t('statusPie.legendLabel')}
                    items={slices.map((slice) => ({ key: slice.key, label: slice.name, color: slice.color, isHidden: isHidden(slice.key) }))}
                    onToggle={toggle}
                />
                <Typography.Text type="secondary" className={styles['tb-execution-status-pie__caption']}>{summary}</Typography.Text>
            </Flex>
        </figure>
    );
}
