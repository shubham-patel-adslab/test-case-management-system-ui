import type { TestCasePriority, TestType } from '../test-case/test-case.type';
import type { UserReferenceResponseDto } from '../user/user.response.dto';

// Results recorded in the range, per status.
export type AnalyticsResultCountsDto = {
    passed: number;
    failed: number;
    blocked: number;
    skipped: number;
};

// OpenAPI AnalyticsResponse — counts only; the UI computes the ratios (ui-requirements §4.5).
export type AnalyticsResponseDto = {
    generatedAt: string;
    range: { from: string; to: string; timeZone: string };
    // null = every project the caller may read.
    projectId: number | null;
    // pending = the current backlog, whatever the range; total = results + pending.
    summary: AnalyticsResultCountsDto & { pending: number; total: number };
    // totalCases: test cases that exist now; executedCases: those with a result in the range.
    coverage: { totalCases: number; executedCases: number };
    // Every day of the range, zeros included.
    trend: (AnalyticsResultCountsDto & { date: string })[];
    // All four priorities, LOW → CRITICAL; all six types — by each test case's current priority / type.
    byPriority: (AnalyticsResultCountsDto & { priority: TestCasePriority; pending: number })[];
    byType: (AnalyticsResultCountsDto & { type: TestType; pending: number })[];
    // By name. pending = assigned to them; executed = results they recorded.
    byTester: (AnalyticsResultCountsDto & { user: UserReferenceResponseDto; pending: number; executed: number })[];
    // Raised in the range.
    defects: { total: number };
};
