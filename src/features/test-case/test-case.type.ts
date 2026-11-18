import { z } from 'zod';
import type { FieldPath } from 'react-hook-form';

import type { testCaseFormSchema } from './test-case.schema';
import type {
    EXECUTION_RESULTS,
    TEST_CASE_PRIORITIES,
    TEST_CASE_SORT_FIELDS,
    TEST_TYPES,
} from './test-case.constant';
import type { PageType } from '../../shared/type/page.type';
import type { ListSort } from '../../shared/type/sort.type';

export type TestCasePriority = (typeof TEST_CASE_PRIORITIES)[number];
export type TestType = (typeof TEST_TYPES)[number];
export type ExecutionResult = (typeof EXECUTION_RESULTS)[number];
export type TestCaseSortField = (typeof TEST_CASE_SORT_FIELDS)[number];

export type TestCaseFormType = z.infer<typeof testCaseFormSchema>;

// A field error the API returned (400 VALIDATION_ERROR), placed on the matching form field.
export type TestCaseFormServerError = {
    name: FieldPath<TestCaseFormType>;
    // i18n key in the 'testCase' namespace.
    message: string;
};

export type TestCaseSummaryType = {
    id: number;
    projectId: number;
    title: string;
    description: string;
    priority: TestCasePriority;
    type: TestType;
    preConditions: string;
    postConditions: string;
    tags: string[];
    suiteIds: number[];
    lastResult: ExecutionResult | null;
    lastExecutedAt: string | null;
    createdAt: string;
    updatedAt: string;
};

export type TestStepType = {
    id: number;
    order: number;
    action: string;
    expectedResult: string;
};

export type TestCaseDetailsType = TestCaseSummaryType & {
    steps: TestStepType[];
};

export type TestCasePageType = PageType<TestCaseSummaryType>;

// The list's search, filters, sort and paging as read from the URL (unknown values already dropped).
export type TestCaseListParamsType = {
    page: number;
    pageSize: number;
    search: string;
    priorities: TestCasePriority[];
    types: TestType[];
    tags: string[];
    suiteId: number | undefined;
    lastResults: ExecutionResult[];
    sort: ListSort<TestCaseSortField>;
};
