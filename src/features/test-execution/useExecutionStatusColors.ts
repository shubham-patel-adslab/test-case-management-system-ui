import { theme } from 'antd';

import type { ExecutionCountKey } from './test-execution.type';
import { useTheme } from '../../shared/theme';

// One color per execution status in every chart (suite run report, dashboard), from antd's palette tokens —
// a set per theme, because the dark algorithm inverts the palette (light red4 becomes a dark maroon).
// Checked with the dataviz palette validator (2026-11-18):
// - light: dark green vs light red separates pass/fail for red-green color blindness too (ΔE 14), which
//   antd's colorSuccess/colorError don't (4.9); blocked is antd's warning gold, ΔE ≥ 11 from every other
//   status (the darker gold9 was 1.9 from passed); with the dark gray for skipped, every pair is ΔE ≥ 10.4
//   for color-blind vision. Light red and gold are under 3:1 on white;
// - dark (surface colorBgContainer): every pair ΔE ≥ 8.7 for color-blind vision, all ≥ 3:1 on the surface.
// Skipped is a neutral gray on purpose. Charts never rely on color alone: legends, tooltips and text summaries.
export function useExecutionStatusColors(): Record<ExecutionCountKey, string> {
    const { token } = theme.useToken();
    const { mode } = useTheme();

    if (mode === 'dark') {
        return {
            passed: token.green7,
            failed: token.red6,
            blocked: token.gold8,
            skipped: token.colorTextTertiary,
            pending: token.blue7,
        };
    }

    return {
        passed: token.green8,
        failed: token.red4,
        blocked: token.gold6,
        // Darker than the dark theme's gray: the lighter one was ΔE 4.3 from the light red for protanopia.
        skipped: token.colorTextSecondary,
        pending: token.blue6,
    };
}
