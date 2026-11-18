import type { PageRequestDto } from '../../shared/request/page.request.dto';

// OpenAPI SuiteRunCreateRequest — body optional. Without an assignee the run's executions are unassigned;
// assigning to someone other than yourself needs TEST_ASSIGNMENT CREATE.
export type SuiteRunCreateRequestDto = {
    assigneeId?: string;
};

export type SuiteRunPageRequestDto = PageRequestDto;
