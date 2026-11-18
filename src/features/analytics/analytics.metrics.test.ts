import { describe, expect, it } from 'vitest';

import { toAnalyticsMetrics } from './analytics.metrics';

const counts = (summary: Partial<Record<'passed' | 'failed' | 'blocked' | 'skipped' | 'pending', number>>) => ({
    passed: 0, failed: 0, blocked: 0, skipped: 0, pending: 0, total: 0, ...summary,
});

describe('dashboard ratios', () => {
    it('computes pass rate from recorded results only, not the pending backlog', () => {
        const metrics = toAnalyticsMetrics({
            summary: counts({ passed: 6, failed: 2, blocked: 1, skipped: 1, pending: 40 }),
            coverage: { totalCases: 20, executedCases: 5 },
            defects: { total: 2 },
        });

        expect(metrics).toEqual({ passRate: 0.6, coverage: 0.25, defectDensity: 0.4 });
    });

    it('returns null instead of dividing by zero', () => {
        expect(toAnalyticsMetrics({
            summary: counts({ pending: 3 }),
            coverage: { totalCases: 0, executedCases: 0 },
            defects: { total: 0 },
        })).toEqual({ passRate: null, coverage: null, defectDensity: null });
    });
});
