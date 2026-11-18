// A top-level page: it covers every project the user may read, or the one picked in its filter.
export const ANALYTICS_DASHBOARD_PATH = '/dashboard';

// The project filter in the URL; left out for all projects.
export const ANALYTICS_PROJECT_PARAM = 'projectId';

// The dashboard's date range (ui-requirements §4.5): presets ending today, or a custom range.
export const ANALYTICS_RANGE_PRESETS = [7, 30, 90] as const;
export const ANALYTICS_DEFAULT_RANGE_DAYS = 30;
// Same limit as the backend: at most 366 calendar days, both ends included.
export const ANALYTICS_RANGE_MAX_DAYS = 366;

// The range in the URL: `days` for a preset (left out for the default), or `from` + `to` (YYYY-MM-DD).
export const ANALYTICS_RANGE_PARAM = {
    DAYS: 'days',
    FROM: 'from',
    TO: 'to',
} as const;

// The bar chart's toggle: results by test case priority, or by type.
export const ANALYTICS_BREAKDOWNS = ['priority', 'type'] as const;
