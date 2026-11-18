import { theme } from 'antd';

import type { ExecutionCountKey } from './test-execution.type';

// One color per execution status in every chart (suite run report, dashboard), from antd's palette tokens.
// Checked with the dataviz palette validator (2026-11-18, light theme): dark green vs light red separates
// pass/fail for red-green color blindness too (ΔE 14), which antd's colorSuccess/colorError don't (4.9).
// Skipped is a neutral gray on purpose. Charts never rely on color alone: legends, tooltips and text summaries.
export function useExecutionStatusColors(): Record<ExecutionCountKey, string> {
    const { token } = theme.useToken();

    return {
        passed: token.green8,
        failed: token.red4,
        blocked: token.gold9,
        skipped: token.colorTextTertiary,
        pending: token.blue6,
    };
}
