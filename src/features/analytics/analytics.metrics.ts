import type { AnalyticsMetricsType, AnalyticsType } from './analytics.type';

// a ÷ b, or null when there's nothing to divide by (shown as "—", never NaN or Infinity).
function ratio(numerator: number, denominator: number): number | null {
    return denominator > 0 ? numerator / denominator : null;
}

// The dashboard's ratios from the API's counts (ui-requirements §4.5 metric definitions):
// - pass rate: passed ÷ the results recorded in the range (pending isn't a result yet);
// - coverage: test cases with a result in the range ÷ test cases that exist now;
// - defect density: defects raised in the range ÷ test cases with a result in the range.
export function toAnalyticsMetrics({ summary, coverage, defects }: Pick<AnalyticsType, 'summary' | 'coverage' | 'defects'>): AnalyticsMetricsType {
    const results = summary.passed + summary.failed + summary.blocked + summary.skipped;

    return {
        passRate: ratio(summary.passed, results),
        coverage: ratio(coverage.executedCases, coverage.totalCases),
        defectDensity: ratio(defects.total, coverage.executedCases),
    };
}
