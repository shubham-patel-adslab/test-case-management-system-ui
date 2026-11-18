import type { ANALYTICS_BREAKDOWNS, ANALYTICS_RANGE_PRESETS } from './analytics.constant';
import type { AnalyticsResponseDto } from './analytics.response.dto';
import type { UserReferenceType } from '../user/user.type';

export type AnalyticsPresetDays = (typeof ANALYTICS_RANGE_PRESETS)[number];
export type AnalyticsBreakdown = (typeof ANALYTICS_BREAKDOWNS)[number];

// The range as chosen: a preset ending today, or fixed days.
export type AnalyticsRangeType =
    | { kind: 'preset'; days: AnalyticsPresetDays }
    | { kind: 'custom'; from: string; to: string };

// Inclusive calendar days, YYYY-MM-DD.
export type AnalyticsDaysType = { from: string; to: string };

export type AnalyticsType = Omit<AnalyticsResponseDto, 'byTester'> & {
    byTester: (Omit<AnalyticsResponseDto['byTester'][number], 'user'> & { user: UserReferenceType })[];
};

// The ratios the UI computes from the counts; null where the denominator is 0 (shown as "—").
export type AnalyticsMetricsType = {
    passRate: number | null;
    coverage: number | null;
    defectDensity: number | null;
};
