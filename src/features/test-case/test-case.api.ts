import { tcmsApiClient } from '../../app/tcms.api.client';
import type {
    TestCaseBulkRequestDto,
    TestCaseCreateRequestDto,
    TestCasePageRequestDto,
    TestCaseUpdateRequestDto,
} from './test-case.request.dto';
import type {
    TestCaseBulkResponseDto,
    TestCaseDetailsResponseDto,
    TestCasePageResponseDto,
} from './test-case.response.dto';

// All test case routes are nested under their project (ui-requirements §6.3).
const testCasesUrl = (projectId: number) => `/projects/${projectId}/test-cases`;

export async function getTestCases(
    projectId: number,
    request: TestCasePageRequestDto,
    signal?: AbortSignal,
): Promise<TestCasePageResponseDto> {
    const response = await tcmsApiClient.get<TestCasePageResponseDto>(testCasesUrl(projectId), { params: request, signal });

    return response.data;
}

export async function getTestCase(projectId: number, testCaseId: number, signal?: AbortSignal): Promise<TestCaseDetailsResponseDto> {
    const response = await tcmsApiClient.get<TestCaseDetailsResponseDto>(`${testCasesUrl(projectId)}/${testCaseId}`, { signal });

    return response.data;
}

export async function createTestCase(projectId: number, request: TestCaseCreateRequestDto): Promise<TestCaseDetailsResponseDto> {
    const response = await tcmsApiClient.post<TestCaseDetailsResponseDto>(testCasesUrl(projectId), request);

    return response.data;
}

export async function updateTestCase(projectId: number, request: TestCaseUpdateRequestDto): Promise<TestCaseDetailsResponseDto> {
    const response = await tcmsApiClient.put<TestCaseDetailsResponseDto>(`${testCasesUrl(projectId)}/${request.id}`, request);

    return response.data;
}

export async function deleteTestCase(projectId: number, testCaseId: number): Promise<void> {
    await tcmsApiClient.delete(`${testCasesUrl(projectId)}/${testCaseId}`);
}

// Delete, change the priority of, or add to a suite several test cases in one call (PRD Features §3).
export async function bulkUpdateTestCases(projectId: number, request: TestCaseBulkRequestDto): Promise<TestCaseBulkResponseDto> {
    const response = await tcmsApiClient.post<TestCaseBulkResponseDto>(`${testCasesUrl(projectId)}/bulk`, request);

    return response.data;
}
