import { tcmsApiClient } from '../../app/tcms.api.client';
import type { DefectCreateRequestDto } from './defect.request.dto';
import type { DefectDetailsResponseDto } from './defect.response.dto';

// Raise a defect from a failed execution (PRD Features §4). 409 when the run didn't fail or already has one.
// No Location: a defect is read through its execution.
export async function createDefect(projectId: number, executionId: number, request: DefectCreateRequestDto): Promise<DefectDetailsResponseDto> {
    const response = await tcmsApiClient.post<DefectDetailsResponseDto>(
        `/projects/${projectId}/test-executions/${executionId}/defects`,
        request,
    );

    return response.data;
}
