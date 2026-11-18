import { tcmsApiClient } from '../../app/tcms.api.client';
import type {
    TestSuiteCasesAddRequestDto,
    TestSuiteCasesReorderRequestDto,
    TestSuiteCreateRequestDto,
    TestSuitePageRequestDto,
    TestSuiteUpdateRequestDto,
} from './test-suite.request.dto';
import type { TestSuiteDetailsResponseDto, TestSuitePageResponseDto } from './test-suite.response.dto';

// All suite routes are nested under their project (ui-requirements §6.3).
const testSuitesUrl = (projectId: number) => `/projects/${projectId}/test-suites`;

// Name A→Z unless `sort` says otherwise (the API's default).
export async function getTestSuites(
    projectId: number,
    request: TestSuitePageRequestDto,
    signal?: AbortSignal,
): Promise<TestSuitePageResponseDto> {
    const response = await tcmsApiClient.get<TestSuitePageResponseDto>(testSuitesUrl(projectId), { params: request, signal });

    return response.data;
}

export async function getTestSuite(projectId: number, suiteId: number, signal?: AbortSignal): Promise<TestSuiteDetailsResponseDto> {
    const response = await tcmsApiClient.get<TestSuiteDetailsResponseDto>(`${testSuitesUrl(projectId)}/${suiteId}`, { signal });

    return response.data;
}

export async function createTestSuite(projectId: number, request: TestSuiteCreateRequestDto): Promise<TestSuiteDetailsResponseDto> {
    const response = await tcmsApiClient.post<TestSuiteDetailsResponseDto>(testSuitesUrl(projectId), request);

    return response.data;
}

export async function updateTestSuite(projectId: number, request: TestSuiteUpdateRequestDto): Promise<TestSuiteDetailsResponseDto> {
    const response = await tcmsApiClient.put<TestSuiteDetailsResponseDto>(`${testSuitesUrl(projectId)}/${request.id}`, request);

    return response.data;
}

// The test cases stay; only the suite and its links go.
export async function deleteTestSuite(projectId: number, suiteId: number): Promise<void> {
    await tcmsApiClient.delete(`${testSuitesUrl(projectId)}/${suiteId}`);
}

export async function addTestSuiteCases(
    projectId: number,
    suiteId: number,
    request: TestSuiteCasesAddRequestDto,
): Promise<TestSuiteDetailsResponseDto> {
    const response = await tcmsApiClient.post<TestSuiteDetailsResponseDto>(`${testSuitesUrl(projectId)}/${suiteId}/test-cases`, request);

    return response.data;
}

// Removes the link only; the test case itself stays.
export async function removeTestSuiteCase(projectId: number, suiteId: number, testCaseId: number): Promise<void> {
    await tcmsApiClient.delete(`${testSuitesUrl(projectId)}/${suiteId}/test-cases/${testCaseId}`);
}

export async function reorderTestSuiteCases(
    projectId: number,
    suiteId: number,
    request: TestSuiteCasesReorderRequestDto,
): Promise<TestSuiteDetailsResponseDto> {
    const response = await tcmsApiClient.patch<TestSuiteDetailsResponseDto>(
        `${testSuitesUrl(projectId)}/${suiteId}/test-cases/reorder`,
        request,
    );

    return response.data;
}
