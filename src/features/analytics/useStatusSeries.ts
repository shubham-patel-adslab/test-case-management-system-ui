import { useTranslation } from 'react-i18next';
import { theme } from 'antd';

import type { ExecutionCountKey } from '../test-execution/test-execution.type';
import { useExecutionStatusColors } from '../test-execution/useExecutionStatusColors';

export type StatusSeries = { key: ExecutionCountKey; label: string; color: string };

// The dashboard charts' series (one per status, in the given order) and their axis styling: muted text and
// a light grid from the theme, so the data marks stand out.
export function useStatusSeries(keys: readonly ExecutionCountKey[]) {
    const { t } = useTranslation('testExecution');
    const { token } = theme.useToken();
    const colors = useExecutionStatusColors();

    const series: StatusSeries[] = keys.map((key) => ({ key, label: t(`count.${key}`), color: colors[key] }));
    const axis = {
        tick: { fill: token.colorTextSecondary, fontSize: token.fontSizeSM },
        axisLine: false,
        tickLine: false,
    };

    return { series, axis, gridColor: token.colorSplit, surfaceColor: token.colorBgContainer };
}

// "Passed 5, Failed 2" — a chart's numbers as text.
export function describeCounts(series: StatusSeries[], counts: Partial<Record<ExecutionCountKey, number>>): string {
    return series.map(({ key, label }) => `${label} ${counts[key] ?? 0}`).join(', ');
}
