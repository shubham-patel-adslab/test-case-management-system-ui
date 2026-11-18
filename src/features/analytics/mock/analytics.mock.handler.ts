import { http, HttpResponse } from 'msw';

import { ANALYTICS_RANGE_MAX_DAYS } from '../analytics.constant';
import type { AnalyticsResponseDto, AnalyticsResultCountsDto } from '../analytics.response.dto';
import { mockErrorResponse, withMockPermission } from '../../auth/mock/auth.mock.handler';
import { PERMISSION_CODE, RESOURCE_CODE } from '../../auth/auth.constant';
import { defectMock } from '../../defect/mock/defect.mock.data';
import { findMockProjectInScope, getMockProjectsInScope } from '../../project/mock/project.mock.handler';
import { TEST_CASE_PRIORITIES, TEST_TYPES } from '../../test-case/test-case.constant';
import { testCaseMock, type MockTestCase } from '../../test-case/mock/test-case.mock.data';
import { executionMock, type MockExecution } from '../../test-execution/mock/test-execution.mock.data';
import { compareMockUserNames, userMock } from '../../user/mock/user.mock.data';
import { mockValidationError } from '../../../shared/mock/page.mock';

const ANALYTICS_URL = `${import.meta.env.VITE_TCMS_API_URL}/analytics`;
const DEFAULT_TIME_ZONE = 'UTC';
const DAY_MS = 24 * 60 * 60 * 1000;
const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
// Region names only, like the backend (an offset such as +05:30 is rejected).
const TIME_ZONE_NAME_PATTERN = /^[A-Za-z_]+(?:\/[A-Za-z0-9_+-]+)*$/;

function isDay(value: string | null): value is string {
    if (!value || !DAY_PATTERN.test(value)) {
        return false;
    }

    // A real day: 2026-13-01 is no date at all, 2026-02-30 rolls over to March.
    const time = Date.parse(`${value}T00:00:00Z`);

    return !Number.isNaN(time) && new Date(time).toISOString().startsWith(value);
}

function isTimeZone(value: string): boolean {
    if (!TIME_ZONE_NAME_PATTERN.test(value)) {
        return false;
    }

    try {
        new Intl.DateTimeFormat('en', { timeZone: value });

        return true;
    } catch {
        return false;
    }
}

// Every calendar day from `from` to `to`, both included.
function listDays(from: string, to: string): string[] {
    const days: string[] = [];

    for (let time = Date.parse(from); time <= Date.parse(to); time += DAY_MS) {
        days.push(new Date(time).toISOString().slice(0, 10));
    }

    return days;
}

function countResults(executions: MockExecution[]): AnalyticsResultCountsDto {
    const count = (status: string) => executions.filter((execution) => execution.status === status).length;

    return { passed: count('PASS'), failed: count('FAIL'), blocked: count('BLOCKED'), skipped: count('SKIPPED') };
}

// The backend's request checks: 400 on the field; a range check only once both days are valid.
function validate(from: string | null, to: string | null, timeZone: string, projectId: string | null) {
    const details = [
        ...(isDay(from) ? [] : [{ field: 'from', message: 'Invalid ISO date' }]),
        ...(isDay(to) ? [] : [{ field: 'to', message: 'Invalid ISO date' }]),
        ...(isTimeZone(timeZone) ? [] : [{ field: 'timeZone', message: 'Must be an IANA time zone, e.g. Europe/Berlin' }]),
        ...(projectId === null || Number(projectId) > 0 ? [] : [{ field: 'projectId', message: 'Must be a positive integer' }]),
    ];

    if (details.length === 0 && from! > to!) {
        details.push({ field: 'to', message: 'Must not be before from' });
    } else if (details.length === 0 && listDays(from!, to!).length > ANALYTICS_RANGE_MAX_DAYS) {
        details.push({ field: 'to', message: `The range must not exceed ${ANALYTICS_RANGE_MAX_DAYS} days` });
    }

    return details.length > 0 ? mockValidationError(details) : undefined;
}

export const analyticsMockHandler = [
    // Like the backend: every project the user may read, or one (404 outside the scope); results by the day
    // they were recorded (in timeZone), pending = the current backlog; counts only.
    http.get(ANALYTICS_URL, withMockPermission(RESOURCE_CODE.ANALYTICS, PERMISSION_CODE.READ, ({ request }) => {
        const url = new URL(request.url);
        const from = url.searchParams.get('from');
        const to = url.searchParams.get('to');
        const timeZone = url.searchParams.get('timeZone') ?? DEFAULT_TIME_ZONE;
        const projectIdParam = url.searchParams.get('projectId');
        const invalid = validate(from, to, timeZone, projectIdParam);

        if (invalid || !from || !to) {
            return invalid;
        }

        const project = projectIdParam === null ? undefined : findMockProjectInScope(Number(projectIdParam), PERMISSION_CODE.READ);

        if (projectIdParam !== null && !project) {
            return mockErrorResponse(404, 'NOT_FOUND', 'Project not found');
        }

        const projectIds = new Set((project ? [project] : getMockProjectsInScope(PERMISSION_CODE.READ)).map(({ id }) => id));
        // The calendar day of a moment in the viewer's zone, as YYYY-MM-DD (en-CA formats it that way).
        const dayFormat = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' });
        const dayOf = (isoDateTime: string) => dayFormat.format(new Date(isoDateTime));
        const isInRange = (isoDateTime: string) => {
            const day = dayOf(isoDateTime);

            return day >= from && day <= to;
        };

        const executions = executionMock.filter((execution) => projectIds.has(execution.projectId));
        const results = executions.filter((execution) => execution.status !== 'PENDING' && execution.executedAt && isInRange(execution.executedAt));
        const pending = executions.filter((execution) => execution.status === 'PENDING');
        const testCaseById = new Map(testCaseMock.filter((testCase) => projectIds.has(testCase.projectId)).map((testCase) => [testCase.id, testCase]));
        // By the test case's current priority / type; a deleted test case's runs fall out here.
        const currentTestCase = (execution: MockExecution): MockTestCase | undefined => (execution.testCaseId === null
            ? undefined
            : testCaseById.get(execution.testCaseId));

        const resultsByDay = new Map<string, MockExecution[]>();

        results.forEach((execution) => {
            const day = dayOf(execution.executedAt!);

            resultsByDay.set(day, [...(resultsByDay.get(day) ?? []), execution]);
        });
        const testerIds = new Set([
            ...pending.flatMap((execution) => (execution.assigneeId ? [execution.assigneeId] : [])),
            ...results.flatMap((execution) => (execution.executedById ? [execution.executedById] : [])),
        ]);

        const response: AnalyticsResponseDto = {
            generatedAt: new Date().toISOString(),
            range: { from, to, timeZone },
            projectId: project?.id ?? null,
            summary: { ...countResults(results), pending: pending.length, total: results.length + pending.length },
            coverage: {
                totalCases: testCaseById.size,
                executedCases: new Set(results.filter(currentTestCase).map((execution) => execution.testCaseId)).size,
            },
            trend: listDays(from, to).map((date) => ({ date, ...countResults(resultsByDay.get(date) ?? []) })),
            byPriority: TEST_CASE_PRIORITIES.map((priority) => {
                const matches = (execution: MockExecution) => currentTestCase(execution)?.priority === priority;

                return { priority, ...countResults(results.filter(matches)), pending: pending.filter(matches).length };
            }),
            byType: TEST_TYPES.map((type) => {
                const matches = (execution: MockExecution) => currentTestCase(execution)?.type === type;

                return { type, ...countResults(results.filter(matches)), pending: pending.filter(matches).length };
            }),
            byTester: userMock
                .filter((user) => testerIds.has(user.id))
                .sort((a, b) => compareMockUserNames(a, b) || a.id.localeCompare(b.id))
                .map((user) => {
                    const recorded = results.filter((execution) => execution.executedById === user.id);

                    return {
                        user: { id: user.id, firstName: user.firstName, lastName: user.lastName },
                        pending: pending.filter((execution) => execution.assigneeId === user.id).length,
                        executed: recorded.length,
                        ...countResults(recorded),
                    };
                }),
            defects: { total: defectMock.filter((defect) => projectIds.has(defect.projectId) && isInRange(defect.createdAt)).length },
        };

        return HttpResponse.json(response);
    })),
];
