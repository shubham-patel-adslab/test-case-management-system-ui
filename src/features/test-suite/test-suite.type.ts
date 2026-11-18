import { z } from 'zod';
import type { FieldPath } from 'react-hook-form';

import type { testSuiteFormSchema } from './test-suite.schema';
import type { TEST_SUITE_SORT_FIELDS } from './test-suite.constant';
import type { TestCasePriority, TestType } from '../test-case/test-case.type';
import type { PageType } from '../../shared/type/page.type';

export type TestSuiteFormType = z.infer<typeof testSuiteFormSchema>;
export type TestSuiteSortField = (typeof TEST_SUITE_SORT_FIELDS)[number];

// A field error the API returned (409 on `name`), placed on the form field.
export type TestSuiteFormServerError = {
    name: FieldPath<TestSuiteFormType>;
    // i18n key in the 'testSuite' namespace.
    message: string;
};

export type TestSuiteSummaryType = {
    id: number;
    projectId: number;
    name: string;
    description: string;
    testCaseCount: number;
    createdAt: string;
    updatedAt: string;
};

// A test case as listed in its suite, in suite order (1..n).
export type TestSuiteCaseType = {
    id: number;
    order: number;
    title: string;
    priority: TestCasePriority;
    type: TestType;
};

export type TestSuiteDetailsType = TestSuiteSummaryType & {
    testCases: TestSuiteCaseType[];
};

export type TestSuitePageType = PageType<TestSuiteSummaryType>;
