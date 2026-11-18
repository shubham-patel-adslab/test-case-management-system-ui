import type { TestExecutionCreateRequestDto, TestExecutionResultRequestDto } from './test-execution.request.dto';
import type {
    TestExecutionAuditLogResponseDto,
    TestExecutionDetailsResponseDto,
    TestExecutionPageResponseDto,
    TestExecutionProgressResponseDto,
    TestExecutionSummaryResponseDto,
} from './test-execution.response.dto';
import type {
    ExecutionProgressType,
    ExecutionResultFormInputType,
    ExecutionResultFormType,
    TestExecutionAuditLogType,
    TestExecutionDetailsType,
    TestExecutionPageType,
    TestExecutionStepType,
    TestExecutionSummaryType,
} from './test-execution.type';
import { toAttachment } from '../attachment/attachment.mapper';
import { toDefectDetails, toDefectReference } from '../defect/defect.mapper';
import { toUserReference } from '../user/user.mapper';
import { toPageType } from '../../shared/mapper/page.mapper';

function toSummaryFields(dto: Omit<TestExecutionSummaryResponseDto, 'defect'>): Omit<TestExecutionSummaryType, 'defect'> {
    return {
        id: dto.id,
        projectId: dto.projectId,
        testCaseId: dto.testCaseId,
        testCaseTitle: dto.testCaseTitle,
        suiteRunId: dto.suiteRunId,
        status: dto.status,
        assignee: dto.assignee && toUserReference(dto.assignee),
        executedBy: dto.executedBy && toUserReference(dto.executedBy),
        executedAt: dto.executedAt,
        createdAt: dto.createdAt,
    };
}

export function toTestExecutionSummary(dto: TestExecutionSummaryResponseDto): TestExecutionSummaryType {
    return { ...toSummaryFields(dto), defect: dto.defect && toDefectReference(dto.defect) };
}

export function toTestExecutionDetails(dto: TestExecutionDetailsResponseDto): TestExecutionDetailsType {
    return {
        ...toSummaryFields(dto),
        comment: dto.comment,
        steps: dto.steps.map((step) => ({
            order: step.order,
            action: step.action,
            expectedResult: step.expectedResult,
            status: step.status,
            comment: step.comment,
        })),
        defect: dto.defect && toDefectDetails(dto.defect),
        attachments: dto.attachments.map(toAttachment),
    };
}

export function toTestExecutionPage(dto: TestExecutionPageResponseDto): TestExecutionPageType {
    return toPageType(dto, toTestExecutionSummary);
}

export function toExecutionProgress(dto: TestExecutionProgressResponseDto): ExecutionProgressType {
    return {
        total: dto.total,
        pending: dto.pending,
        passed: dto.passed,
        failed: dto.failed,
        blocked: dto.blocked,
        skipped: dto.skipped,
    };
}

export function toTestExecutionAuditLogs(dtos: TestExecutionAuditLogResponseDto[]): TestExecutionAuditLogType[] {
    return dtos.map((dto) => ({
        id: dto.id,
        action: dto.action,
        actor: dto.actor && toUserReference(dto.actor),
        details: dto.details,
        createdAt: dto.createdAt,
    }));
}

// A blank result form: no overall result yet, one empty entry per step — by position, like the steps shown
// (the API sends them in step order).
export function toExecutionResultFormValues(steps: Pick<TestExecutionStepType, 'order'>[]): ExecutionResultFormInputType {
    return {
        status: null,
        comment: '',
        steps: steps.map(() => ({ status: null, comment: '' })),
    };
}

// Only the steps given a result are sent (by `order` = index + 1); an empty step comment is left out.
export function toTestExecutionResultRequestDto(form: ExecutionResultFormType): TestExecutionResultRequestDto {
    const stepResults = form.steps.flatMap((step, index) => (step.status
        ? [{ order: index + 1, status: step.status, ...(step.comment ? { comment: step.comment } : {}) }]
        : []));

    return {
        status: form.status,
        comment: form.comment,
        ...(stepResults.length > 0 ? { stepResults } : {}),
    };
}

export function toTestExecutionCreateRequestDto(testCaseId: number, form: ExecutionResultFormType): TestExecutionCreateRequestDto {
    return { testCaseId, ...toTestExecutionResultRequestDto(form) };
}
