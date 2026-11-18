import { http, HttpResponse } from 'msw';

import { nextMockStepId, testCaseMock, type MockTestCase } from './test-case.mock.data';
import { TEST_CASE_BULK_ACTION, TEST_CASE_DEFAULT_SORT, TEST_CASE_PRIORITIES, TEST_CASE_SORT_FIELDS } from '../test-case.constant';
import type { TestCaseSortField } from '../test-case.type';
import type { TestCaseBulkRequestDto, TestCaseCreateRequestDto, TestCaseUpdateRequestDto } from '../test-case.request.dto';
import type { TestCaseDetailsResponseDto, TestCasePageResponseDto, TestCaseSummaryResponseDto } from '../test-case.response.dto';
import { getMockSessionUser, mockErrorResponse, mockHasPermission, withMockPermission } from '../../auth/mock/auth.mock.handler';
import { PERMISSION_CODE, RESOURCE_CODE } from '../../auth/auth.constant';
import { findMockProjectInScope } from '../../project/mock/project.mock.handler';
import {
    getMockSuiteIdsOfTestCase,
    setMockSuitesOfTestCase,
    testSuiteMock,
} from '../../test-suite/mock/test-suite.mock.data';
import { detachMockExecutionsOfTestCase } from '../../test-execution/mock/test-execution.mock.data';
import { compareMockText, getMockPaging, getMockSort, mockValidationError, toMockPage } from '../../../shared/mock/page.mock';

const TEST_CASES_URL = `${import.meta.env.VITE_TCMS_API_URL}/projects/:projectId/test-cases`;

const notFound = (message: string) => mockErrorResponse(404, 'NOT_FOUND', message);

export function toTestCaseDetailsResponse(testCase: MockTestCase): TestCaseDetailsResponseDto {
    return { ...testCase, suiteIds: getMockSuiteIdsOfTestCase(testCase.id) };
}

// List items carry no steps, like the backend's summaries.
function toTestCaseSummaryResponse(testCase: MockTestCase): TestCaseSummaryResponseDto {
    return {
        id: testCase.id,
        projectId: testCase.projectId,
        title: testCase.title,
        description: testCase.description,
        priority: testCase.priority,
        type: testCase.type,
        preConditions: testCase.preConditions,
        postConditions: testCase.postConditions,
        tags: testCase.tags,
        suiteIds: getMockSuiteIdsOfTestCase(testCase.id),
        lastResult: testCase.lastResult,
        lastExecutedAt: testCase.lastExecutedAt,
        createdBy: testCase.createdBy,
        createdAt: testCase.createdAt,
        updatedAt: testCase.updatedAt,
    };
}

// A test case of a project the user reaches; another project's test case is a 404 like a missing one.
export function findMockTestCase(projectId: number, testCaseId: number): MockTestCase | undefined {
    return testCaseMock.find((testCase) => testCase.id === testCaseId && testCase.projectId === projectId);
}

const listParam = (url: URL, name: string) => url.searchParams.get(name)?.split(',').filter(Boolean) ?? [];

// Same order rules as the backend: priority by rank, title case-insensitive, never-executed last in both
// directions, id as the tie-breaker in the same direction.
// The backend's order: case-insensitive title, priority by rank, never-executed last in both directions; ties
// by id in the same direction.
function compareTestCases(field: TestCaseSortField, direction: number) {
    const rank = (testCase: MockTestCase) => TEST_CASE_PRIORITIES.indexOf(testCase.priority);

    return (a: MockTestCase, b: MockTestCase): number => {
        if (field === 'lastExecutedAt' && (a.lastExecutedAt === null) !== (b.lastExecutedAt === null)) {
            return a.lastExecutedAt === null ? 1 : -1;
        }

        const byField: Record<TestCaseSortField, number> = {
            title: compareMockText(a.title, b.title),
            priority: rank(a) - rank(b),
            type: a.type.localeCompare(b.type),
            createdAt: a.createdAt.localeCompare(b.createdAt),
            updatedAt: a.updatedAt.localeCompare(b.updatedAt),
            lastExecutedAt: (a.lastExecutedAt ?? '').localeCompare(b.lastExecutedAt ?? ''),
        };

        return direction * (byField[field] || a.id - b.id);
    };
}

// The backend's body checks the UI form can't rule out: suites must be the project's (a suite may have been
// deleted meanwhile), no duplicate suites.
function validateSuites(projectId: number, suiteIds: number[]) {
    if (new Set(suiteIds).size !== suiteIds.length) {
        return mockValidationError([{ field: 'suiteIds', message: 'Must not contain duplicates' }]);
    }

    const details = suiteIds.flatMap((suiteId, index) => (
        testSuiteMock.some((suite) => suite.id === suiteId && suite.projectId === projectId)
            ? []
            : [{ field: `suiteIds[${index}]`, message: 'Unknown test suite' }]
    ));

    return details.length > 0 ? mockValidationError(details) : undefined;
}

// Trimmed, lowercased, merged — like the API.
const normalizeTags = (tags: string[]) => [...new Set(tags.map((tag) => tag.trim().toLowerCase()))];

function toStoredFields(body: TestCaseCreateRequestDto) {
    return {
        title: body.title,
        description: body.description,
        priority: body.priority,
        type: body.type,
        preConditions: body.preConditions,
        postConditions: body.postConditions,
        tags: normalizeTags(body.tags),
        // The array order is the order; client ids/orders are ignored.
        steps: body.steps.map((step, index) => ({
            id: nextMockStepId(),
            order: index + 1,
            action: step.action,
            expectedResult: step.expectedResult,
        })),
    };
}

export const testCaseMockHandler = [
    http.get(TEST_CASES_URL, withMockPermission(RESOURCE_CODE.TEST_CASE, PERMISSION_CODE.READ, ({ params, request }) => {
        const projectId = Number(params.projectId);

        if (!findMockProjectInScope(projectId, PERMISSION_CODE.READ)) {
            return notFound('Project not found');
        }

        const { url, page, pageSize } = getMockPaging(request);
        const search = url.searchParams.get('search')?.toLowerCase() ?? '';
        const priorities = listParam(url, 'priority');
        const types = listParam(url, 'type');
        const tags = listParam(url, 'tags').map((tag) => tag.toLowerCase());
        const suiteId = Number(url.searchParams.get('suiteId')) || undefined;
        const lastResults = listParam(url, 'lastResult');
        const { sort, error } = getMockSort(url, TEST_CASE_SORT_FIELDS, TEST_CASE_DEFAULT_SORT);

        if (error) {
            return error;
        }

        const suiteCaseIds = suiteId === undefined ? undefined : testSuiteMock.find((suite) => suite.id === suiteId)?.testCaseIds ?? [];

        const testCases = testCaseMock
            .filter((testCase) => testCase.projectId === projectId)
            .filter((testCase) => !search
                || testCase.title.toLowerCase().includes(search)
                || testCase.description.toLowerCase().includes(search))
            .filter((testCase) => priorities.length === 0 || priorities.includes(testCase.priority))
            .filter((testCase) => types.length === 0 || types.includes(testCase.type))
            .filter((testCase) => tags.length === 0 || testCase.tags.some((tag) => tags.includes(tag)))
            .filter((testCase) => suiteCaseIds === undefined || suiteCaseIds.includes(testCase.id))
            .filter((testCase) => lastResults.length === 0 || (testCase.lastResult !== null && lastResults.includes(testCase.lastResult)))
            .sort(compareTestCases(sort.field, sort.direction === 'asc' ? 1 : -1));

        // Page first: summaries look up suite membership, only needed for the rows returned.
        const casePage = toMockPage(testCases, page, pageSize);
        const response: TestCasePageResponseDto = { ...casePage, items: casePage.items.map(toTestCaseSummaryResponse) };

        return HttpResponse.json(response);
    })),

    http.post(TEST_CASES_URL, withMockPermission(RESOURCE_CODE.TEST_CASE, PERMISSION_CODE.CREATE, async ({ params, request }) => {
        const projectId = Number(params.projectId);

        // Changing a project's content is acting on the project: write scope (ALL_PROJECTS UPDATE).
        if (!findMockProjectInScope(projectId, PERMISSION_CODE.UPDATE)) {
            return notFound('Project not found');
        }

        const body = await request.json() as TestCaseCreateRequestDto;
        const suiteError = validateSuites(projectId, body.suiteIds);

        if (suiteError) {
            return suiteError;
        }

        const now = new Date().toISOString();
        const testCase: MockTestCase = {
            id: testCaseMock.reduce((maxId, testCase) => Math.max(maxId, testCase.id), 0) + 1,
            projectId,
            ...toStoredFields(body),
            lastResult: null,
            lastExecutedAt: null,
            createdBy: getMockSessionUser()!.id,
            createdAt: now,
            updatedAt: now,
        };

        testCaseMock.push(testCase);
        setMockSuitesOfTestCase(testCase.id, body.suiteIds);

        return HttpResponse.json(toTestCaseDetailsResponse(testCase), { status: 201 });
    })),

    // Like the backend: TEST_CASE UPDATE on the route, DELETE too for a bulk delete; the suite and every id
    // must be the project's, else 400 and nothing changes; ASSIGN_TO_SUITE counts only newly added cases.
    http.post(`${TEST_CASES_URL}/bulk`, withMockPermission(RESOURCE_CODE.TEST_CASE, PERMISSION_CODE.UPDATE, async ({ params, request }) => {
        const projectId = Number(params.projectId);
        const body = await request.json() as TestCaseBulkRequestDto;

        if (body.action === TEST_CASE_BULK_ACTION.DELETE
            && !mockHasPermission(getMockSessionUser()!, RESOURCE_CODE.TEST_CASE, PERMISSION_CODE.DELETE)) {
            return mockErrorResponse(403, 'FORBIDDEN', 'Missing permission TEST_CASE DELETE');
        }

        if (!findMockProjectInScope(projectId, PERMISSION_CODE.UPDATE)) {
            return notFound('Project not found');
        }

        if (body.testCaseIds.length === 0 || new Set(body.testCaseIds).size !== body.testCaseIds.length) {
            return mockValidationError([{ field: 'testCaseIds', message: 'Must be 1–100 ids without duplicates' }]);
        }

        const suite = body.action === TEST_CASE_BULK_ACTION.ASSIGN_TO_SUITE
            ? testSuiteMock.find((suite) => suite.id === body.suiteId && suite.projectId === projectId)
            : undefined;

        if (body.action === TEST_CASE_BULK_ACTION.ASSIGN_TO_SUITE && !suite) {
            return mockValidationError([{ field: 'suiteId', message: 'Unknown test suite in this project' }]);
        }

        const unknown = body.testCaseIds.flatMap((testCaseId, index) => (
            findMockTestCase(projectId, testCaseId) ? [] : [{ field: `testCaseIds[${index}]`, message: 'Unknown test case in this project' }]
        ));

        if (unknown.length > 0) {
            return mockValidationError(unknown);
        }

        const testCases = body.testCaseIds.map((testCaseId) => findMockTestCase(projectId, testCaseId)!);
        let affectedCount = testCases.length;

        if (body.action === TEST_CASE_BULK_ACTION.DELETE) {
            testCases.forEach((testCase) => {
                setMockSuitesOfTestCase(testCase.id, []);
                detachMockExecutionsOfTestCase(testCase.id);
                testCaseMock.splice(testCaseMock.indexOf(testCase), 1);
            });
        } else if (body.action === TEST_CASE_BULK_ACTION.UPDATE_PRIORITY) {
            const now = new Date().toISOString();
            testCases.forEach((testCase) => Object.assign(testCase, { priority: body.priority, updatedAt: now }));
        } else if (suite) {
            // Appended in the order given; cases already in the suite keep their place and don't count.
            const newIds = body.testCaseIds.filter((testCaseId) => !suite.testCaseIds.includes(testCaseId));
            suite.testCaseIds.push(...newIds);
            affectedCount = newIds.length;
        }

        return HttpResponse.json({ affectedCount });
    })),

    http.get(`${TEST_CASES_URL}/:testCaseId`, withMockPermission(RESOURCE_CODE.TEST_CASE, PERMISSION_CODE.READ, ({ params }) => {
        const projectId = Number(params.projectId);
        const testCase = findMockProjectInScope(projectId, PERMISSION_CODE.READ)
            && findMockTestCase(projectId, Number(params.testCaseId));

        return testCase ? HttpResponse.json(toTestCaseDetailsResponse(testCase)) : notFound('Test case not found');
    })),

    http.put(`${TEST_CASES_URL}/:testCaseId`, withMockPermission(RESOURCE_CODE.TEST_CASE, PERMISSION_CODE.UPDATE, async ({ params, request }) => {
        const projectId = Number(params.projectId);
        const testCaseId = Number(params.testCaseId);
        const testCase = findMockProjectInScope(projectId, PERMISSION_CODE.UPDATE) && findMockTestCase(projectId, testCaseId);

        if (!testCase) {
            return notFound('Test case not found');
        }

        const body = await request.json() as TestCaseUpdateRequestDto;

        if (body.id !== testCaseId) {
            return mockValidationError([{ field: 'id', message: 'Must match the test case id in the URL' }]);
        }

        const suiteError = validateSuites(projectId, body.suiteIds);

        if (suiteError) {
            return suiteError;
        }

        Object.assign(testCase, { ...toStoredFields(body), updatedAt: new Date().toISOString() });
        setMockSuitesOfTestCase(testCase.id, body.suiteIds);

        return HttpResponse.json(toTestCaseDetailsResponse(testCase));
    })),

    http.delete(`${TEST_CASES_URL}/:testCaseId`, withMockPermission(RESOURCE_CODE.TEST_CASE, PERMISSION_CODE.DELETE, ({ params }) => {
        const projectId = Number(params.projectId);
        const testCase = findMockProjectInScope(projectId, PERMISSION_CODE.UPDATE)
            && findMockTestCase(projectId, Number(params.testCaseId));

        if (!testCase) {
            return notFound('Test case not found');
        }

        setMockSuitesOfTestCase(testCase.id, []);
        detachMockExecutionsOfTestCase(testCase.id);
        testCaseMock.splice(testCaseMock.indexOf(testCase), 1);

        return new HttpResponse(null, { status: 204 });
    })),
];
