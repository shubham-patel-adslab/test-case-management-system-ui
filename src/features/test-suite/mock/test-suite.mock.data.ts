import type { TestSuiteDetailsResponseDto, TestSuiteSummaryResponseDto } from '../test-suite.response.dto';
import { testCaseMock } from '../../test-case/mock/test-case.mock.data';
import { userMock } from '../../user/mock/user.mock.data';

// A suite as the mock "database" holds it: its test cases as ids in suite order (the backend's
// test_suite_cases). testCaseCount is derived.
export type MockTestSuite = Omit<TestSuiteSummaryResponseDto, 'testCaseCount'> & {
    testCaseIds: number[];
};

const SUITE_NAMES = ['Smoke', 'Regression', 'Authentication', 'Checkout flow', 'Release 2.0', 'Nightly'];
const MOCK_PROJECT_COUNT = 25;
const BASE_DATE = Date.UTC(2026, 6, 15);
const DAY_MS = 24 * 60 * 60 * 1000;

const [, testLead] = userMock;

function seedSuites(): MockTestSuite[] {
    const suites: MockTestSuite[] = [];

    for (let projectId = 1; projectId <= MOCK_PROJECT_COUNT; projectId++) {
        const projectCaseIds = testCaseMock.filter((testCase) => testCase.projectId === projectId).map((testCase) => testCase.id);
        const suiteCount = projectId === 1 ? SUITE_NAMES.length : 2 + (projectId % 3);

        SUITE_NAMES.slice(0, suiteCount).forEach((name, suiteIndex) => {
            const createdAt = new Date(BASE_DATE + (projectId + suiteIndex) * DAY_MS).toISOString();

            suites.push({
                id: suites.length + 1,
                projectId,
                name,
                description: `${name} tests for this project.`,
                createdBy: testLead.id,
                createdAt,
                updatedAt: createdAt,
                // Every (suiteIndex + 3)th case, so suites overlap and differ in size.
                testCaseIds: projectCaseIds.filter((_, caseIndex) => caseIndex % (suiteIndex + 3) === 0),
            });
        });
    }

    return suites;
}

// Mutable on purpose: the handlers write to it so changes survive until reload.
export const testSuiteMock: MockTestSuite[] = seedSuites();

export function toTestSuiteSummaryResponse(suite: MockTestSuite): TestSuiteSummaryResponseDto {
    return {
        id: suite.id,
        projectId: suite.projectId,
        name: suite.name,
        description: suite.description,
        testCaseCount: suite.testCaseIds.length,
        createdBy: suite.createdBy,
        createdAt: suite.createdAt,
        updatedAt: suite.updatedAt,
    };
}

// The suite with its test cases in order (1..n), like the backend's details.
export function toTestSuiteDetailsResponse(suite: MockTestSuite): TestSuiteDetailsResponseDto {
    return {
        ...toTestSuiteSummaryResponse(suite),
        testCases: suite.testCaseIds.flatMap((testCaseId, index) => {
            const testCase = testCaseMock.find((candidate) => candidate.id === testCaseId);

            return testCase
                ? [{ id: testCase.id, order: index + 1, title: testCase.title, priority: testCase.priority, type: testCase.type }]
                : [];
        }),
    };
}

// The suites a test case is in, by suite id (the backend returns them in that order).
export function getMockSuiteIdsOfTestCase(testCaseId: number): number[] {
    return testSuiteMock.filter((suite) => suite.testCaseIds.includes(testCaseId)).map((suite) => suite.id);
}

// Like the backend's replace-as-a-whole: leaves suites not listed, joins new ones at the end, keeps the
// position in suites it stays in.
export function setMockSuitesOfTestCase(testCaseId: number, suiteIds: number[]): void {
    testSuiteMock.forEach((suite) => {
        const isMember = suite.testCaseIds.includes(testCaseId);
        const shouldBeMember = suiteIds.includes(suite.id);

        if (isMember && !shouldBeMember) {
            suite.testCaseIds = suite.testCaseIds.filter((id) => id !== testCaseId);
        } else if (!isMember && shouldBeMember) {
            suite.testCaseIds.push(testCaseId);
        }
    });
}
