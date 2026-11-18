import type { DefectDetailsResponseDto, DefectReferenceResponseDto } from '../defect.response.dto';
import type { DefectSeverity } from '../defect.type';
import { executionMock } from '../../test-execution/mock/test-execution.mock.data';
import { userMock } from '../../user/mock/user.mock.data';

// A defect as the mock "database" holds it (one per execution, only from a FAIL).
export type MockDefect = Omit<DefectDetailsResponseDto, 'createdBy'> & { createdById: string };

const SEVERITIES: DefectSeverity[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const [, , tester] = userMock;

// Every third failed run already has a defect, so lists and run pages show some.
export const defectMock: MockDefect[] = executionMock
    .filter((execution) => execution.status === 'FAIL')
    .filter((_, index) => index % 3 === 0)
    .map((execution, index) => ({
        id: index + 1,
        projectId: execution.projectId,
        executionId: execution.id,
        title: `Failed: ${execution.testCaseTitle}`,
        description: 'Steps to reproduce: see the run.',
        severity: SEVERITIES[index % SEVERITIES.length],
        createdById: tester.id,
        createdAt: execution.executedAt ?? execution.createdAt,
        updatedAt: execution.executedAt ?? execution.createdAt,
    }));

export function findMockDefectOfExecution(executionId: number): MockDefect | undefined {
    return defectMock.find((defect) => defect.executionId === executionId);
}

export function toDefectReferenceResponse(defect: MockDefect): DefectReferenceResponseDto {
    return { id: defect.id, title: defect.title, severity: defect.severity };
}

export function toDefectDetailsResponse(defect: MockDefect): DefectDetailsResponseDto {
    const creator = userMock.find((user) => user.id === defect.createdById);

    return {
        ...toDefectReferenceResponse(defect),
        projectId: defect.projectId,
        executionId: defect.executionId,
        description: defect.description,
        createdBy: creator ? { id: creator.id, firstName: creator.firstName, lastName: creator.lastName } : null,
        createdAt: defect.createdAt,
        updatedAt: defect.updatedAt,
    };
}
