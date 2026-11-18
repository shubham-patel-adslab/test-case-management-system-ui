import type { ExecutionAuditAction, ExecutionStatus } from './test-execution.type';
import type { AttachmentResponseDto } from '../attachment/attachment.response.dto';
import type { DefectDetailsResponseDto, DefectReferenceResponseDto } from '../defect/defect.response.dto';
import type { ExecutionResult } from '../test-case/test-case.type';
import type { UserReferenceResponseDto } from '../user/user.response.dto';
import type { PageResponseDto } from '../../shared/response/page.response.dto';

// OpenAPI TestExecutionSummaryResponse. The user references and `defect` are nullable in the backend code;
// the OpenAPI spec omits the null (ui-requirements §11 q. 11) — these types follow the code.
export type TestExecutionSummaryResponseDto = {
    id: number;
    projectId: number;
    testCaseId: number | null;
    testCaseTitle: string;
    suiteRunId: number | null;
    status: ExecutionStatus;
    assignee: UserReferenceResponseDto | null;
    executedBy: UserReferenceResponseDto | null;
    executedAt: string | null;
    defect: DefectReferenceResponseDto | null;
    createdAt: string;
    updatedAt: string;
};

// OpenAPI TestExecutionStepResponse — pending: the test case's current steps (status null); recorded: the
// execution's own copy with its results.
export type TestExecutionStepResponseDto = {
    order: number;
    action: string;
    expectedResult: string;
    status: ExecutionResult | null;
    comment: string;
};

// OpenAPI TestExecutionDetailsResponse.
export type TestExecutionDetailsResponseDto = Omit<TestExecutionSummaryResponseDto, 'defect'> & {
    comment: string;
    steps: TestExecutionStepResponseDto[];
    defect: DefectDetailsResponseDto | null;
    attachments: AttachmentResponseDto[];
};

export type TestExecutionPageResponseDto = PageResponseDto<TestExecutionSummaryResponseDto>;

// OpenAPI TestExecutionProgressResponse — every execution counts, pending included.
export type TestExecutionProgressResponseDto = {
    total: number;
    pending: number;
    passed: number;
    failed: number;
    blocked: number;
    skipped: number;
};

// OpenAPI TestExecutionAssignResponse.
export type TestExecutionAssignResponseDto = {
    createdCount: number;
};

// OpenAPI TestExecutionAuditLogResponse — `details` depends on the action: CREATED { assigneeId } or
// { suiteRunId, assigneeId }, RESULT_RECORDED { status }, ATTACHMENT_ADDED { attachmentIds, fileNames },
// DEFECT_CREATED { defectId }.
export type TestExecutionAuditLogResponseDto = {
    id: number;
    action: ExecutionAuditAction;
    actor: UserReferenceResponseDto | null;
    details: Record<string, unknown>;
    createdAt: string;
};
