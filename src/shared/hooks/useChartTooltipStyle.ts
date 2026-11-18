import { theme } from 'antd';

// Recharts' default tooltip is a white box with series-colored text — unreadable in the dark theme, and
// status colors make poor text in either. This one is an elevated surface from the theme, text in text colors.
export function useChartTooltipStyle() {
    const { token } = theme.useToken();

    return {
        contentStyle: {
            backgroundColor: token.colorBgElevated,
            border: `1px solid ${token.colorBorderSecondary}`,
            borderRadius: token.borderRadius,
            boxShadow: token.boxShadowSecondary,
        },
        labelStyle: { color: token.colorText },
        itemStyle: { color: token.colorText },
        // The band behind the hovered bar group, the line at the hovered day.
        barCursor: { fill: token.colorFillTertiary },
        lineCursor: { stroke: token.colorTextQuaternary },
    };
}
