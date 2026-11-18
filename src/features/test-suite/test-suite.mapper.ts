import type { TestSuiteCreateRequestDto, TestSuiteUpdateRequestDto } from './test-suite.request.dto';
import type {
    TestSuiteDetailsResponseDto,
    TestSuitePageResponseDto,
    TestSuiteSummaryResponseDto,
} from './test-suite.response.dto';
import type {
    TestSuiteDetailsType,
    TestSuiteFormType,
    TestSuitePageType,
    TestSuiteSummaryType,
} from './test-suite.type';
import { toPageType } from '../../shared/mapper/page.mapper';

export function toTestSuiteSummary(dto: TestSuiteSummaryResponseDto): TestSuiteSummaryType {
    return {
        id: dto.id,
        projectId: dto.projectId,
        name: dto.name,
        description: dto.description,
        testCaseCount: dto.testCaseCount,
        createdAt: dto.createdAt,
        updatedAt: dto.updatedAt,
    };
}

export function toTestSuiteDetails(dto: TestSuiteDetailsResponseDto): TestSuiteDetailsType {
    return {
        ...toTestSuiteSummary(dto),
        testCases: dto.testCases.map((testCase) => ({
            id: testCase.id,
            order: testCase.order,
            title: testCase.title,
            priority: testCase.priority,
            type: testCase.type,
        })),
    };
}

export function toTestSuitePage(dto: TestSuitePageResponseDto): TestSuitePageType {
    return toPageType(dto, toTestSuiteSummary);
}

// Only the editable fields, so the update form's dirty check compares like with like.
export function toTestSuiteFormValues(suite: TestSuiteDetailsType): TestSuiteFormType {
    return { name: suite.name, description: suite.description };
}

export function toTestSuiteCreateRequestDto(form: TestSuiteFormType): TestSuiteCreateRequestDto {
    return { name: form.name, description: form.description };
}

export function toTestSuiteUpdateRequestDto(id: number, form: TestSuiteFormType): TestSuiteUpdateRequestDto {
    return { id, ...toTestSuiteCreateRequestDto(form) };
}

// The cached details in a new case order, before the server confirms it (optimistic reorder). `order` is
// renumbered 1..n like the API's response.
export function withTestSuiteCaseOrder(suite: TestSuiteDetailsResponseDto, testCaseIds: number[]): TestSuiteDetailsResponseDto {
    const byId = new Map(suite.testCases.map((testCase) => [testCase.id, testCase]));
    const testCases = testCaseIds.flatMap((id, index) => {
        const testCase = byId.get(id);
        return testCase ? [{ ...testCase, order: index + 1 }] : [];
    });

    return { ...suite, testCases };
}
