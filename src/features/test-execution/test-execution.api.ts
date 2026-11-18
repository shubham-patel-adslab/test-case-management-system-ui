import { tcmsApiClient } from '../../app/tcms.api.client';
import type {
    TestExecutionAssignRequestDto,
    TestExecutionCreateRequestDto,
    TestExecutionPageRequestDto,
    TestExecutionResultRequestDto,
} from './test-execution.request.dto';
import type {
    TestExecutionAssignResponseDto,
    TestExecutionAuditLogResponseDto,
    TestExecutionDetailsResponseDto,
    TestExecutionPageResponseDto,
    TestExecutionProgressResponseDto,
} from './test-execution.response.dto';

// All execution routes are nested under their project (ui-requirements §6.3).
const executionsUrl = (projectId: number) => `/projects/${projectId}/test-executions`;

// Newest first.
export async function getTestExecutions(
    projectId: number,
    request: TestExecutionPageRequestDto,
    signal?: AbortSignal,
): Promise<TestExecutionPageResponseDto> {
    const response = await tcmsApiClient.get<TestExecutionPageResponseDto>(executionsUrl(projectId), { params: request, signal });

    return response.data;
}

// The project's progress, or one assignee's.
export async function getTestExecutionProgress(
    projectId: number,
    assigneeId: string | undefined,
    signal?: AbortSignal,
): Promise<TestExecutionProgressResponseDto> {
    const response = await tcmsApiClient.get<TestExecutionProgressResponseDto>(
        `${executionsUrl(projectId)}/progress`,
        { params: { assigneeId }, signal },
    );

    return response.data;
}

export async function getTestExecution(projectId: number, executionId: number, signal?: AbortSignal): Promise<TestExecutionDetailsResponseDto> {
    const response = await tcmsApiClient.get<TestExecutionDetailsResponseDto>(`${executionsUrl(projectId)}/${executionId}`, { signal });

    return response.data;
}

export async function assignTestCases(projectId: number, request: TestExecutionAssignRequestDto): Promise<TestExecutionAssignResponseDto> {
    const response = await tcmsApiClient.post<TestExecutionAssignResponseDto>(`${executionsUrl(projectId)}/assignments`, request);

    return response.data;
}

// Run a test case ad hoc: the result is recorded at once.
export async function createTestExecution(projectId: number, request: TestExecutionCreateRequestDto): Promise<TestExecutionDetailsResponseDto> {
    const response = await tcmsApiClient.post<TestExecutionDetailsResponseDto>(executionsUrl(projectId), request);

    return response.data;
}

// Record the result of a pending execution — once; 409 if someone recorded it first.
export async function recordTestExecutionResult(
    projectId: number,
    executionId: number,
    request: TestExecutionResultRequestDto,
): Promise<TestExecutionDetailsResponseDto> {
    const response = await tcmsApiClient.put<TestExecutionDetailsResponseDto>(`${executionsUrl(projectId)}/${executionId}`, request);

    return response.data;
}

// Oldest first; a plain array.
export async function getTestExecutionAudit(
    projectId: number,
    executionId: number,
    signal?: AbortSignal,
): Promise<TestExecutionAuditLogResponseDto[]> {
    const response = await tcmsApiClient.get<TestExecutionAuditLogResponseDto[]>(`${executionsUrl(projectId)}/${executionId}/audit`, { signal });

    return response.data;
}
