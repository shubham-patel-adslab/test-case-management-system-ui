import type { AnalyticsRequestDto } from './analytics.request.dto';
import type { AnalyticsResponseDto } from './analytics.response.dto';
import { tcmsApiClient } from '../../app/tcms.api.client';

// The whole dashboard in one request.
export async function getAnalytics(request: AnalyticsRequestDto, signal?: AbortSignal): Promise<AnalyticsResponseDto> {
    const response = await tcmsApiClient.get<AnalyticsResponseDto>('/analytics', { params: request, signal });

    return response.data;
}
