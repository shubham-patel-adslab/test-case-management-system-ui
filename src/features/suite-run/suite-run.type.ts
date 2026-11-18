import type { ExecutionProgressType, TestExecutionSummaryType } from '../test-execution/test-execution.type';
import type { UserReferenceType } from '../user/user.type';
import type { PageType } from '../../shared/type/page.type';

export type SuiteRunSummaryType = {
    id: number;
    suiteId: number | null;
    suiteName: string;
    createdBy: UserReferenceType | null;
    createdAt: string;
    progress: ExecutionProgressType;
};

export type SuiteRunDetailsType = SuiteRunSummaryType & {
    executions: TestExecutionSummaryType[];
};

export type SuiteRunPageType = PageType<SuiteRunSummaryType>;
