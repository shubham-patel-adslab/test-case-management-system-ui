import type { AnalyticsRequestDto } from './analytics.request.dto';

export function analyticsQueryKey(request: AnalyticsRequestDto) {
    return ['analytics', request] as const;
}
