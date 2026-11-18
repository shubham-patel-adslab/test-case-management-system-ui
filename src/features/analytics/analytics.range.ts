import dayjs from 'dayjs';

import { ANALYTICS_DEFAULT_RANGE_DAYS, ANALYTICS_RANGE_MAX_DAYS, ANALYTICS_RANGE_PARAM, ANALYTICS_RANGE_PRESETS } from './analytics.constant';
import type { AnalyticsDaysType, AnalyticsPresetDays, AnalyticsRangeType } from './analytics.type';

const DAY_FORMAT = 'YYYY-MM-DD';
const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const DEFAULT_ANALYTICS_RANGE: AnalyticsRangeType = { kind: 'preset', days: ANALYTICS_DEFAULT_RANGE_DAYS };

// The viewer's time zone and today in it: the API counts days in the zone the UI sends (ui-requirements §4.5).
export function getViewerTimeZone(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function getViewerToday(): string {
    return dayjs().format(DAY_FORMAT);
}

function isDay(value: string | null): value is string {
    // A real day: 2026-02-30 would roll over to March, so it doesn't format back to itself.
    return !!value && DAY_PATTERN.test(value) && dayjs(value).format(DAY_FORMAT) === value;
}

// Calendar days from `from` to `to`, both included.
function countDays(from: string, to: string): number {
    return dayjs(to).diff(dayjs(from), 'day') + 1;
}

// What the API accepts — from ≤ to, at most 366 days — and nothing after today (there's nothing to show).
export function isValidCustomRange(from: string, to: string, today: string): boolean {
    return isDay(from) && isDay(to) && from <= to && to <= today && countDays(from, to) <= ANALYTICS_RANGE_MAX_DAYS;
}

function toPresetDays(value: string | null): AnalyticsPresetDays | undefined {
    return ANALYTICS_RANGE_PRESETS.find((days) => String(days) === value);
}

// The URL's range; anything the API would reject (or a hand-edited typo) falls back to the default.
export function parseAnalyticsRange(searchParams: URLSearchParams, today: string): AnalyticsRangeType {
    const from = searchParams.get(ANALYTICS_RANGE_PARAM.FROM);
    const to = searchParams.get(ANALYTICS_RANGE_PARAM.TO);

    if (from && to && isValidCustomRange(from, to, today)) {
        return { kind: 'custom', from, to };
    }

    const days = toPresetDays(searchParams.get(ANALYTICS_RANGE_PARAM.DAYS));

    return days ? { kind: 'preset', days } : DEFAULT_ANALYTICS_RANGE;
}

// The days a range covers; a preset ends today ("last 7 days" = today and the 6 before).
export function toAnalyticsDays(range: AnalyticsRangeType, today: string): AnalyticsDaysType {
    if (range.kind === 'custom') {
        return { from: range.from, to: range.to };
    }

    return { from: dayjs(today).subtract(range.days - 1, 'day').format(DAY_FORMAT), to: today };
}

// Writes the range into the URL params; the default leaves none (one URL per range, like list sorting).
export function setAnalyticsRangeParams(searchParams: URLSearchParams, range: AnalyticsRangeType): URLSearchParams {
    Object.values(ANALYTICS_RANGE_PARAM).forEach((name) => searchParams.delete(name));

    if (range.kind === 'custom') {
        searchParams.set(ANALYTICS_RANGE_PARAM.FROM, range.from);
        searchParams.set(ANALYTICS_RANGE_PARAM.TO, range.to);
    } else if (range.days !== ANALYTICS_DEFAULT_RANGE_DAYS) {
        searchParams.set(ANALYTICS_RANGE_PARAM.DAYS, String(range.days));
    }

    return searchParams;
}
