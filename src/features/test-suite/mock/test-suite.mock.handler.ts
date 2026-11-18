import { http, HttpResponse } from 'msw';

import { testSuiteMock, toTestSuiteDetailsResponse, toTestSuiteSummaryResponse, type MockTestSuite } from './test-suite.mock.data';
import type {
    TestSuiteCasesAddRequestDto,
    TestSuiteCasesReorderRequestDto,
    TestSuiteCreateRequestDto,
    TestSuiteUpdateRequestDto,
} from '../test-suite.request.dto';
import type { TestSuitePageResponseDto } from '../test-suite.response.dto';
import { getMockSessionUser, mockErrorResponse, withMockPermission } from '../../auth/mock/auth.mock.handler';
import { PERMISSION_CODE, RESOURCE_CODE } from '../../auth/auth.constant';
import type { PermissionCode } from '../../auth/auth.type';
import { findMockProjectInScope } from '../../project/mock/project.mock.handler';
import { findMockTestCase } from '../../test-case/mock/test-case.mock.handler';
import { getMockPaging, mockValidationError, toMockPage } from '../../../shared/mock/page.mock';

const TEST_SUITES_URL = `${import.meta.env.VITE_TCMS_API_URL}/projects/:projectId/test-suites`;
const NAME_TAKEN_MESSAGE = 'A test suite with this name already exists in the project';

const notFound = (message: string) => mockErrorResponse(404, 'NOT_FOUND', message);

// A suite of a project the user reaches with the permission's scope (READ for reads, UPDATE for changes —
// the backend's assertReadable / assertWritable); another project's suite is a 404 like a missing one.
function findMockSuite(params: Record<string, unknown>, permission: PermissionCode): MockTestSuite | undefined {
    const projectId = Number(params.projectId);

    return findMockProjectInScope(projectId, permission)
        ? testSuiteMock.find((suite) => suite.id === Number(params.suiteId) && suite.projectId === projectId)
        : undefined;
}

// Unique per project, ignoring case — 409 on `name`, like the backend's unique index.
function isNameTaken(projectId: number, name: string, exceptSuiteId?: number): boolean {
    return testSuiteMock.some((suite) => suite.projectId === projectId
        && suite.id !== exceptSuiteId
        && suite.name.toLowerCase() === name.toLowerCase());
}

const nameTaken = () => HttpResponse.json(
    { error: { code: 'CONFLICT', message: NAME_TAKEN_MESSAGE, details: [{ field: 'name', message: NAME_TAKEN_MESSAGE }] } },
    { status: 409 },
);

export const testSuiteMockHandler = [
    // By name, like the backend.
    http.get(TEST_SUITES_URL, withMockPermission(RESOURCE_CODE.TEST_SUITE, PERMISSION_CODE.READ, ({ params, request }) => {
        const projectId = Number(params.projectId);

        if (!findMockProjectInScope(projectId, PERMISSION_CODE.READ)) {
            return notFound('Project not found');
        }

        const { page, pageSize } = getMockPaging(request);
        const suites = testSuiteMock
            .filter((suite) => suite.projectId === projectId)
            .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()) || a.id - b.id)
            .map(toTestSuiteSummaryResponse);

        const response: TestSuitePageResponseDto = toMockPage(suites, page, pageSize);

        return HttpResponse.json(response);
    })),

    http.post(TEST_SUITES_URL, withMockPermission(RESOURCE_CODE.TEST_SUITE, PERMISSION_CODE.CREATE, async ({ params, request }) => {
        const projectId = Number(params.projectId);

        if (!findMockProjectInScope(projectId, PERMISSION_CODE.UPDATE)) {
            return notFound('Project not found');
        }

        const body = await request.json() as TestSuiteCreateRequestDto;

        if (isNameTaken(projectId, body.name)) {
            return nameTaken();
        }

        const now = new Date().toISOString();
        const suite: MockTestSuite = {
            id: testSuiteMock.reduce((maxId, suite) => Math.max(maxId, suite.id), 0) + 1,
            projectId,
            name: body.name,
            description: body.description,
            createdBy: getMockSessionUser()!.id,
            createdAt: now,
            updatedAt: now,
            testCaseIds: [],
        };

        testSuiteMock.push(suite);

        return HttpResponse.json(toTestSuiteDetailsResponse(suite), { status: 201 });
    })),

    http.get(`${TEST_SUITES_URL}/:suiteId`, withMockPermission(RESOURCE_CODE.TEST_SUITE, PERMISSION_CODE.READ, ({ params }) => {
        const suite = findMockSuite(params, PERMISSION_CODE.READ);

        return suite ? HttpResponse.json(toTestSuiteDetailsResponse(suite)) : notFound('Test suite not found');
    })),

    http.put(`${TEST_SUITES_URL}/:suiteId`, withMockPermission(RESOURCE_CODE.TEST_SUITE, PERMISSION_CODE.UPDATE, async ({ params, request }) => {
        const suite = findMockSuite(params, PERMISSION_CODE.UPDATE);

        if (!suite) {
            return notFound('Test suite not found');
        }

        const body = await request.json() as TestSuiteUpdateRequestDto;

        if (body.id !== suite.id) {
            return mockValidationError([{ field: 'id', message: 'Must match the suite id in the URL' }]);
        }

        if (isNameTaken(suite.projectId, body.name, suite.id)) {
            return nameTaken();
        }

        Object.assign(suite, { name: body.name, description: body.description, updatedAt: new Date().toISOString() });

        return HttpResponse.json(toTestSuiteDetailsResponse(suite));
    })),

    // The test cases stay.
    http.delete(`${TEST_SUITES_URL}/:suiteId`, withMockPermission(RESOURCE_CODE.TEST_SUITE, PERMISSION_CODE.DELETE, ({ params }) => {
        const suite = findMockSuite(params, PERMISSION_CODE.UPDATE);

        if (!suite) {
            return notFound('Test suite not found');
        }

        testSuiteMock.splice(testSuiteMock.indexOf(suite), 1);

        return new HttpResponse(null, { status: 204 });
    })),

    // Appended in the order given; cases already in the suite keep their place; any id not in the project →
    // 400 on testCaseIds[i] and nothing is added.
    http.post(`${TEST_SUITES_URL}/:suiteId/test-cases`, withMockPermission(RESOURCE_CODE.TEST_SUITE, PERMISSION_CODE.UPDATE, async ({ params, request }) => {
        const suite = findMockSuite(params, PERMISSION_CODE.UPDATE);

        if (!suite) {
            return notFound('Test suite not found');
        }

        const { testCaseIds } = await request.json() as TestSuiteCasesAddRequestDto;
        const unknown = testCaseIds.flatMap((testCaseId, index) => (
            findMockTestCase(suite.projectId, testCaseId) ? [] : [{ field: `testCaseIds[${index}]`, message: 'Unknown test case in this project' }]
        ));

        if (unknown.length > 0) {
            return mockValidationError(unknown);
        }

        suite.testCaseIds.push(...testCaseIds.filter((testCaseId) => !suite.testCaseIds.includes(testCaseId)));

        return HttpResponse.json(toTestSuiteDetailsResponse(suite));
    })),

    // The link only; 404 when the case isn't in the suite.
    http.delete(`${TEST_SUITES_URL}/:suiteId/test-cases/:testCaseId`, withMockPermission(RESOURCE_CODE.TEST_SUITE, PERMISSION_CODE.UPDATE, ({ params }) => {
        const suite = findMockSuite(params, PERMISSION_CODE.UPDATE);
        const testCaseId = Number(params.testCaseId);

        if (!suite || !suite.testCaseIds.includes(testCaseId)) {
            return notFound('Test case not in this suite');
        }

        suite.testCaseIds = suite.testCaseIds.filter((id) => id !== testCaseId);

        return new HttpResponse(null, { status: 204 });
    })),

    // Every case of the suite exactly once, in the new order.
    http.patch(`${TEST_SUITES_URL}/:suiteId/test-cases/reorder`, withMockPermission(RESOURCE_CODE.TEST_SUITE, PERMISSION_CODE.UPDATE, async ({ params, request }) => {
        const suite = findMockSuite(params, PERMISSION_CODE.UPDATE);

        if (!suite) {
            return notFound('Test suite not found');
        }

        const { testCaseIds } = await request.json() as TestSuiteCasesReorderRequestDto;
        const isSameSet = testCaseIds.length === suite.testCaseIds.length
            && new Set(testCaseIds).size === testCaseIds.length
            && testCaseIds.every((testCaseId) => suite.testCaseIds.includes(testCaseId));

        if (!isSameSet) {
            return mockValidationError([{ field: 'testCaseIds', message: 'Must list every test case in the suite exactly once' }]);
        }

        suite.testCaseIds = [...testCaseIds];

        return HttpResponse.json(toTestSuiteDetailsResponse(suite));
    })),
];
