import { EXECUTION_RESULTS, TEST_CASE_PRIORITIES, TEST_TYPES } from '../test-case.constant';
import type { TestCaseDetailsResponseDto } from '../test-case.response.dto';
import { userMock } from '../../user/mock/user.mock.data';

// A test case as the mock "database" holds it. Suite membership lives on the suites (they own the order),
// like the backend's test_suite_cases; the handlers derive `suiteIds` from it.
export type MockTestCase = Omit<TestCaseDetailsResponseDto, 'suiteIds'>;

// ui-requirements §8: one sample project with ~1,000 test cases (pagination, virtual scrolling) —
// "Customer Portal" (id 1), which every mock test account is a member of. Other projects get a few each.
export const LARGE_MOCK_PROJECT_ID = 1;
const LARGE_PROJECT_CASE_COUNT = 1000;
const MOCK_PROJECT_COUNT = 25;

const FEATURES = ['Login', 'Checkout', 'Search', 'User profile', 'Payments', 'Notifications', 'Reports', 'Settings', 'Cart', 'Onboarding'];
const SCENARIOS = [
    'with valid input', 'with empty required fields', 'on a slow network', 'after the session expires',
    'with maximum-length values', 'as a first-time user', 'with special characters', 'on a mobile viewport',
];
const TAG_POOL = ['smoke', 'regression', 'auth', 'payments', 'ui', 'api', 'mobile', 'critical-path', 'edge-case', 'performance'];

// Early enough that every seeded date (created + up to 60 days to the last run) lies in the past.
const BASE_DATE = Date.UTC(2026, 4, 1);
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

// Deterministic pseudo-random numbers (Park–Miller), so every reload shows the same data. Its products stay
// below 2^53, so JavaScript numbers keep them exact.
function createRandom(seed: number) {
    let state = seed;

    return (max: number) => {
        state = (state * 48271) % 2147483647;
        return state % max;
    };
}

const [admin, testLead] = userMock;
let nextStepId = 1;

function createTestCase(id: number, projectId: number, index: number, random: (max: number) => number): MockTestCase {
    const feature = FEATURES[index % FEATURES.length];
    const scenario = SCENARIOS[Math.floor(index / FEATURES.length) % SCENARIOS.length];
    const round = Math.floor(index / (FEATURES.length * SCENARIOS.length));
    const createdAt = new Date(BASE_DATE + index * 3 * HOUR_MS).toISOString();
    const isExecuted = random(10) >= 3;
    const tags = [...new Set(Array.from({ length: random(4) }, () => TAG_POOL[random(TAG_POOL.length)]))];

    return {
        id,
        projectId,
        title: `${feature} ${scenario}${round > 0 ? ` (variant ${round + 1})` : ''}`,
        description: `Checks that ${feature.toLowerCase()} behaves correctly ${scenario}.`,
        priority: TEST_CASE_PRIORITIES[random(TEST_CASE_PRIORITIES.length)],
        type: TEST_TYPES[random(TEST_TYPES.length)],
        preConditions: random(2) ? `The user is signed in.\nThe ${feature.toLowerCase()} page is reachable.` : '',
        postConditions: random(3) ? '' : 'Test data is cleaned up.',
        tags,
        steps: Array.from({ length: 1 + random(5) }, (_, stepIndex) => ({
            id: nextStepId++,
            order: stepIndex + 1,
            action: `Step ${stepIndex + 1}: perform the ${feature.toLowerCase()} action ${scenario}.`,
            expectedResult: `The ${feature.toLowerCase()} result is shown without errors.`,
        })),
        lastResult: isExecuted ? EXECUTION_RESULTS[random(EXECUTION_RESULTS.length)] : null,
        lastExecutedAt: isExecuted ? new Date(Date.parse(createdAt) + (1 + random(60)) * DAY_MS).toISOString() : null,
        createdBy: (random(3) ? testLead : admin).id,
        createdAt,
        updatedAt: createdAt,
    };
}

function seedTestCases(): MockTestCase[] {
    const random = createRandom(42);
    const testCases: MockTestCase[] = [];

    for (let projectId = 1; projectId <= MOCK_PROJECT_COUNT; projectId++) {
        const count = projectId === LARGE_MOCK_PROJECT_ID ? LARGE_PROJECT_CASE_COUNT : 8 + (projectId % 5) * 4;

        for (let index = 0; index < count; index++) {
            testCases.push(createTestCase(testCases.length + 1, projectId, index, random));
        }
    }

    return testCases;
}

// Mutable on purpose: the handlers write to it so changes survive until reload.
export const testCaseMock: MockTestCase[] = seedTestCases();

export function nextMockStepId(): number {
    return nextStepId++;
}
