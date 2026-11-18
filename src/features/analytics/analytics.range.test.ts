import { describe, expect, it } from 'vitest';

import { isValidCustomRange, parseAnalyticsRange, setAnalyticsRangeParams, toAnalyticsDays } from './analytics.range';

const TODAY = '2026-11-18';
const parse = (query: string) => parseAnalyticsRange(new URLSearchParams(query), TODAY);

describe('dashboard date range', () => {
    it('defaults to the last 30 days, ending today and including it', () => {
        expect(parse('')).toEqual({ kind: 'preset', days: 30 });
        expect(toAnalyticsDays(parse(''), TODAY)).toEqual({ from: '2026-10-20', to: '2026-11-18' });
        expect(toAnalyticsDays({ kind: 'preset', days: 7 }, TODAY)).toEqual({ from: '2026-11-12', to: '2026-11-18' });
    });

    it('reads a preset or a custom range from the URL', () => {
        expect(parse('days=90')).toEqual({ kind: 'preset', days: 90 });
        expect(parse('from=2026-01-01&to=2026-01-31')).toEqual({ kind: 'custom', from: '2026-01-01', to: '2026-01-31' });
    });

    it('falls back to the default for anything the API would reject', () => {
        expect(parse('days=45')).toEqual({ kind: 'preset', days: 30 });
        expect(parse('from=2026-02-30&to=2026-03-05')).toEqual({ kind: 'preset', days: 30 });
        expect(parse('from=2026-03-05&to=2026-03-01')).toEqual({ kind: 'preset', days: 30 });
    });

    it('allows at most 366 days, both ends included, and nothing after today', () => {
        expect(isValidCustomRange('2025-11-18', '2026-11-18', TODAY)).toBe(true);
        expect(isValidCustomRange('2025-11-17', '2026-11-18', TODAY)).toBe(false);
        expect(isValidCustomRange('2026-11-18', '2026-11-19', TODAY)).toBe(false);
    });

    it('keeps one URL per range: the default leaves no params', () => {
        expect(setAnalyticsRangeParams(new URLSearchParams('days=7'), { kind: 'preset', days: 30 }).toString()).toBe('');
        expect(setAnalyticsRangeParams(new URLSearchParams('from=2026-01-01&to=2026-01-02'), { kind: 'preset', days: 90 }).toString()).toBe('days=90');
        expect(setAnalyticsRangeParams(new URLSearchParams('days=7'), { kind: 'custom', from: '2026-01-01', to: '2026-01-02' }).toString())
            .toBe('from=2026-01-01&to=2026-01-02');
    });
});
