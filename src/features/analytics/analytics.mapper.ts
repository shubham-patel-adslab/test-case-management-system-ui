import type { AnalyticsResponseDto } from './analytics.response.dto';
import type { AnalyticsType } from './analytics.type';
import { toUserReference } from '../user/user.mapper';

export function toAnalytics(dto: AnalyticsResponseDto): AnalyticsType {
    return {
        ...dto,
        byTester: dto.byTester.map(({ user, ...counts }) => ({ ...counts, user: toUserReference(user) })),
    };
}
