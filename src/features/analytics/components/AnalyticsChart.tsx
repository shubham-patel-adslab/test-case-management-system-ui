import { useTranslation } from 'react-i18next';
import { Flex } from 'antd';

import styles from './AnalyticsChart.module.scss';
import type { StatusSeries } from '../useStatusSeries';
import { ChartLegend } from '../../../shared/components/ChartLegend';

type AnalyticsChartProps = {
    // The chart's numbers as text, for screen readers (ui-requirements §5.6).
    summary: string;
    series: StatusSeries[];
    isHidden: (key: string) => boolean;
    onToggle: (key: string) => void;
    children: React.ReactNode;
};

// The frame of a dashboard chart: the plot (an image to assistive tech, with its numbers as its label) and a
// legend that switches series off.
export function AnalyticsChart({ summary, series, isHidden, onToggle, children }: AnalyticsChartProps) {
    const { t } = useTranslation('analytics');

    return (
        <figure className={styles['tb-analytics-chart']}>
            <Flex vertical gap="small">
                <div role="img" aria-label={summary}>{children}</div>
                <ChartLegend
                    label={t('chart.legendLabel')}
                    items={series.map(({ key, label, color }) => ({ key, label, color, isHidden: isHidden(key) }))}
                    onToggle={onToggle}
                />
            </Flex>
        </figure>
    );
}
