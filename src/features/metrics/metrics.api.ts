import type { CacheMetricsResponseDto } from './metrics.response.dto';
import { tcmsApiClient } from '../../app/tcms.api.client';

export async function getCacheMetrics(signal?: AbortSignal): Promise<CacheMetricsResponseDto> {
    const response = await tcmsApiClient.get<CacheMetricsResponseDto>('/metrics/cache', { signal });

    return response.data;
}
