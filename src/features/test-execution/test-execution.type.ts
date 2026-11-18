import { z } from 'zod';

import type { executionResultFormSchema } from './test-execution.schema';
import type {
    EXECUTION_AUDIT_ACTIONS,
    EXECUTION_COUNT_KEYS,
    EXECUTION_QUEUE_TAB,
    EXECUTION_RESULT_COUNT_KEYS,
    EXECUTION_STATUSES,
    TEST_EXECUTION_SORT_FIELDS,
} from './test-execution.constant';
import type { AttachmentType } from '../attachment/attachment.type';
import type { DefectDetailsType, DefectReferenceType } from '../defect/defect.type';
import type { ExecutionResult } from '../test-case/test-case.type';
import type { UserReferenceType } from '../user/user.type';
import type { PageType } from '../../shared/type/page.type';

export type ExecutionStatus = (typeof EXECUTION_STATUSES)[number];
export type ExecutionAuditAction = (typeof EXECUTION_AUDIT_ACTIONS)[number];
export type ExecutionQueueTab = (typeof EXECUTION_QUEUE_TAB)[keyof typeof EXECUTION_QUEUE_TAB];
export type TestExecutionSortField = (typeof TEST_EXECUTION_SORT_FIELDS)[number];
export type ExecutionCountKey = (typeof EXECUTION_COUNT_KEYS)[number];
export type ExecutionResultCountKey = (typeof EXECUTION_RESULT_COUNT_KEYS)[number];

// The form edits `status: null` until a result is picked; the schema turns it into a result on submit.
export type ExecutionResultFormInputType = z.input<typeof executionResultFormSchema>;
export type ExecutionResultFormType = z.output<typeof executionResultFormSchema>;

export type TestExecutionSummaryType = {
    id: number;
    projectId: number;
    // null once the test case is deleted (the execution keeps its own copy of title and steps).
    testCaseId: number | null;
    testCaseTitle: string;
    suiteRunId: number | null;
    status: ExecutionStatus;
    assignee: UserReferenceType | null;
    executedBy: UserReferenceType | null;
    executedAt: string | null;
    defect: DefectReferenceType | null;
    createdAt: string;
};

export type TestExecutionStepType = {
    order: number;
    action: string;
    expectedResult: string;
    // null: no per-step result (always on a pending execution).
    status: ExecutionResult | null;
    comment: string;
};

export type TestExecutionDetailsType = Omit<TestExecutionSummaryType, 'defect'> & {
    comment: string;
    steps: TestExecutionStepType[];
    defect: DefectDetailsType | null;
    attachments: AttachmentType[];
};

export type TestExecutionPageType = PageType<TestExecutionSummaryType>;

export type ExecutionProgressType = {
    total: number;
    pending: number;
    passed: number;
    failed: number;
    blocked: number;
    skipped: number;
};

export type TestExecutionAuditLogType = {
    id: number;
    action: ExecutionAuditAction;
    actor: UserReferenceType | null;
    details: Record<string, unknown>;
    createdAt: string;
};
