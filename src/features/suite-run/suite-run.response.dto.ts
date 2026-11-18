import type { TestExecutionProgressResponseDto, TestExecutionSummaryResponseDto } from '../test-execution/test-execution.response.dto';
import type { UserReferenceResponseDto } from '../user/user.response.dto';
import type { PageResponseDto } from '../../shared/response/page.response.dto';

// OpenAPI SuiteRunSummaryResponse. `suiteName` is a snapshot; `suiteId` is null once the suite is deleted
// (the report stays). `createdBy` is nullable in the backend code (the spec omits it — ui-req §11 q. 11).
export type SuiteRunSummaryResponseDto = {
    id: number;
    projectId: number;
    suiteId: number | null;
    suiteName: string;
    createdBy: UserReferenceResponseDto | null;
    createdAt: string;
    progress: TestExecutionProgressResponseDto;
};

// OpenAPI SuiteRunDetailsResponse — the suite report: the run's executions in suite order.
export type SuiteRunDetailsResponseDto = SuiteRunSummaryResponseDto & {
    executions: TestExecutionSummaryResponseDto[];
};

export type SuiteRunPageResponseDto = PageResponseDto<SuiteRunSummaryResponseDto>;
