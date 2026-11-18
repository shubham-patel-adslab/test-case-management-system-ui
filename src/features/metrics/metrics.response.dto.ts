// OpenAPI CacheMetricsResponse (GET /metrics/cache). Counters live in the API process's memory since `since`.
export type CacheMetricsEntryResponseDto = {
    // 'analytics' | 'test-suite-list' | 'project' today — a string on the wire.
    name: string;
    ttlSeconds: number;
    hits: number;
    misses: number;
    // Served without the cache: caching off, or Redis unreachable.
    bypasses: number;
    // Redis commands that failed (the request was still answered from the database).
    errors: number;
    // hits / (hits + misses), 0..1; null before the first cached read.
    hitRate: number | null;
    // Average service time (authorization excluded); null until there is something to average.
    averageHitMs: number | null;
    averageMissMs: number | null;
    averageBypassMs: number | null;
};

export type CacheMetricsResponseDto = {
    enabled: boolean;
    // ioredis connection state (ready, connecting, reconnecting, …) or 'disabled'.
    redisStatus: string;
    since: string;
    lastError: { message: string; at: string } | null;
    caches: CacheMetricsEntryResponseDto[];
};
