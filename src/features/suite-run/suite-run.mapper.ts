import type { SuiteRunDetailsResponseDto, SuiteRunPageResponseDto, SuiteRunSummaryResponseDto } from './suite-run.response.dto';
import type { SuiteRunDetailsType, SuiteRunPageType, SuiteRunSummaryType } from './suite-run.type';
import { toExecutionProgress, toTestExecutionSummary } from '../test-execution/test-execution.mapper';
import { toUserReference } from '../user/user.mapper';
import { toPageType } from '../../shared/mapper/page.mapper';

export function toSuiteRunSummary(dto: SuiteRunSummaryResponseDto): SuiteRunSummaryType {
    return {
        id: dto.id,
        suiteId: dto.suiteId,
        suiteName: dto.suiteName,
        createdBy: dto.createdBy && toUserReference(dto.createdBy),
        createdAt: dto.createdAt,
        progress: toExecutionProgress(dto.progress),
    };
}

export function toSuiteRunDetails(dto: SuiteRunDetailsResponseDto): SuiteRunDetailsType {
    return { ...toSuiteRunSummary(dto), executions: dto.executions.map(toTestExecutionSummary) };
}

export function toSuiteRunPage(dto: SuiteRunPageResponseDto): SuiteRunPageType {
    return toPageType(dto, toSuiteRunSummary);
}
