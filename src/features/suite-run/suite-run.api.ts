import { tcmsApiClient } from '../../app/tcms.api.client';
import type { SuiteRunCreateRequestDto, SuiteRunPageRequestDto } from './suite-run.request.dto';
import type { SuiteRunDetailsResponseDto, SuiteRunPageResponseDto } from './suite-run.response.dto';

// Run a whole suite: one pending execution per test case, in suite order; 409 for an empty suite.
export async function runTestSuite(projectId: number, suiteId: number, request: SuiteRunCreateRequestDto): Promise<SuiteRunDetailsResponseDto> {
    const response = await tcmsApiClient.post<SuiteRunDetailsResponseDto>(`/projects/${projectId}/test-suites/${suiteId}/runs`, request);

    return response.data;
}

// A suite's runs, newest first.
export async function getSuiteRuns(
    projectId: number,
    suiteId: number,
    request: SuiteRunPageRequestDto,
    signal?: AbortSignal,
): Promise<SuiteRunPageResponseDto> {
    const response = await tcmsApiClient.get<SuiteRunPageResponseDto>(`/projects/${projectId}/test-suites/${suiteId}/runs`, { params: request, signal });

    return response.data;
}

// The suite report — still available after the suite is deleted.
export async function getSuiteRun(projectId: number, runId: number, signal?: AbortSignal): Promise<SuiteRunDetailsResponseDto> {
    const response = await tcmsApiClient.get<SuiteRunDetailsResponseDto>(`/projects/${projectId}/suite-runs/${runId}`, { signal });

    return response.data;
}
