import { http, HttpResponse } from 'msw';

import type { CacheMetricsEntryResponseDto, CacheMetricsResponseDto } from '../metrics.response.dto';
import { withMockPermission } from '../../auth/mock/auth.mock.handler';
import { PERMISSION_CODE, RESOURCE_CODE } from '../../auth/auth.constant';

const CACHE_METRICS_URL = `${import.meta.env.VITE_TCMS_API_URL}/metrics/cache`;
const MS_DECIMALS = 100;

// The mock API has no cache, so these counters are a fixed sample — the averages are the backend's own
// measurements on its demo data (caching.md, 2026-11-18). Counted "since" the mock started, like a restart.
const MOCK_SINCE = new Date().toISOString();

type MockCacheCounters = Pick<CacheMetricsEntryResponseDto, 'name' | 'ttlSeconds' | 'hits' | 'misses'> & {
    hitMs: number;
    missMs: number;
};

const MOCK_CACHES: MockCacheCounters[] = [
    { name: 'analytics', ttlSeconds: 15 * 60, hits: 38, misses: 12, hitMs: 1.1, missMs: 11.9 },
    { name: 'test-suite-list', ttlSeconds: 30 * 60, hits: 64, misses: 9, hitMs: 1.0, missMs: 6.9 },
    { name: 'project', ttlSeconds: 60 * 60, hits: 121, misses: 14, hitMs: 1.3, missMs: 2.6 },
];

function round(value: number): number {
    return Math.round(value * MS_DECIMALS) / MS_DECIMALS;
}

function toEntry({ hitMs, missMs, ...cache }: MockCacheCounters): CacheMetricsEntryResponseDto {
    const lookups = cache.hits + cache.misses;

    return {
        ...cache,
        bypasses: 0,
        errors: 0,
        hitRate: lookups === 0 ? null : cache.hits / lookups,
        averageHitMs: cache.hits === 0 ? null : round(hitMs),
        averageMissMs: cache.misses === 0 ? null : round(missMs),
        averageBypassMs: null,
    };
}

export const metricsMockHandler = [
    // Admins only (METRICS READ), like the backend.
    http.get(CACHE_METRICS_URL, withMockPermission(RESOURCE_CODE.METRICS, PERMISSION_CODE.READ, () => {
        const body: CacheMetricsResponseDto = {
            enabled: true,
            redisStatus: 'ready',
            since: MOCK_SINCE,
            lastError: null,
            caches: MOCK_CACHES.map(toEntry),
        };

        return HttpResponse.json(body);
    })),
];
