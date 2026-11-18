import type { TestCaseCreateRequestDto, TestCaseUpdateRequestDto } from './test-case.request.dto';
import type {
    TestCaseDetailsResponseDto,
    TestCasePageResponseDto,
    TestCaseSummaryResponseDto,
} from './test-case.response.dto';
import type {
    TestCaseDetailsType,
    TestCaseFormServerError,
    TestCaseFormType,
    TestCasePageType,
    TestCaseSummaryType,
} from './test-case.type';
import { toPageType } from '../../shared/mapper/page.mapper';
import type { ErrorDetailDto } from '../../shared/response/error.response.dto';

export function toTestCaseSummary(dto: TestCaseSummaryResponseDto): TestCaseSummaryType {
    return {
        id: dto.id,
        projectId: dto.projectId,
        title: dto.title,
        description: dto.description,
        priority: dto.priority,
        type: dto.type,
        preConditions: dto.preConditions,
        postConditions: dto.postConditions,
        tags: dto.tags,
        suiteIds: dto.suiteIds,
        lastResult: dto.lastResult,
        lastExecutedAt: dto.lastExecutedAt,
        createdAt: dto.createdAt,
        updatedAt: dto.updatedAt,
    };
}

export function toTestCaseDetails(dto: TestCaseDetailsResponseDto): TestCaseDetailsType {
    return {
        ...toTestCaseSummary(dto),
        steps: dto.steps.map((step) => ({
            id: step.id,
            order: step.order,
            action: step.action,
            expectedResult: step.expectedResult,
        })),
    };
}

export function toTestCasePage(dto: TestCasePageResponseDto): TestCasePageType {
    return toPageType(dto, toTestCaseSummary);
}

// Only the editable fields, so the update form's dirty check compares like with like. Steps in order,
// without their ids: an update replaces them as a whole.
export function toTestCaseFormValues(testCase: TestCaseDetailsType): TestCaseFormType {
    return {
        title: testCase.title,
        description: testCase.description,
        priority: testCase.priority,
        type: testCase.type,
        preConditions: testCase.preConditions,
        postConditions: testCase.postConditions,
        tags: testCase.tags,
        // In step order, as the API sends them.
        steps: testCase.steps.map((step) => ({ action: step.action, expectedResult: step.expectedResult })),
        suiteIds: testCase.suiteIds,
    };
}

export function toTestCaseCreateRequestDto(form: TestCaseFormType): TestCaseCreateRequestDto {
    return {
        title: form.title,
        description: form.description,
        priority: form.priority,
        type: form.type,
        preConditions: form.preConditions,
        postConditions: form.postConditions,
        tags: form.tags,
        steps: form.steps.map((step) => ({ action: step.action, expectedResult: step.expectedResult })),
        suiteIds: form.suiteIds,
    };
}

export function toTestCaseUpdateRequestDto(id: number, form: TestCaseFormType): TestCaseUpdateRequestDto {
    return { id, ...toTestCaseCreateRequestDto(form) };
}

const FORM_FIELDS = new Set<string>([
    'title', 'description', 'priority', 'type', 'preConditions', 'postConditions', 'tags', 'steps', 'suiteIds',
]);
const STEP_FIELD_PATTERN = /^steps\[(\d+)\]\.(action|expectedResult)$/;

// A 400 VALIDATION_ERROR's details onto the form's fields (ui-requirements §4.3). The API's paths look like
// `steps[0].action` or `suiteIds[2]`; its messages are English zod text, so the form shows its own.
// Details for anything the form doesn't have are left out (the page shows its general error).
export function toTestCaseFormServerErrors(details: ErrorDetailDto[]): TestCaseFormServerError[] {
    return details.flatMap(({ field }): TestCaseFormServerError[] => {
        const step = STEP_FIELD_PATTERN.exec(field);

        if (step) {
            const [, index, name] = step;
            return [{ name: `steps.${Number(index)}.${name as 'action' | 'expectedResult'}`, message: 'validation.serverRejected' }];
        }

        const root = field.split(/[.[]/)[0];

        if (root === 'suiteIds') {
            // A suite deleted while the form was open.
            return [{ name: 'suiteIds', message: 'validation.suiteUnavailable' }];
        }

        return FORM_FIELDS.has(root)
            ? [{ name: root as TestCaseFormServerError['name'], message: 'validation.serverRejected' }]
            : [];
    });
}
