import { z } from 'zod';

import {
    TEST_CASE_PRIORITIES,
    TEST_CASE_SUITES_MAX,
    TEST_CASE_TAG_MAX_LENGTH,
    TEST_CASE_TAGS_MAX,
    TEST_CASE_TEXT_MAX_LENGTH,
    TEST_CASE_TITLE_MAX_LENGTH,
    TEST_STEP_TEXT_MAX_LENGTH,
    TEST_STEPS_MAX,
    TEST_TYPES,
} from './test-case.constant';

// Messages are i18next keys (namespace 'testCase'), translated at render time. Every text is trimmed
// before its checks (ui-requirements §5.5); limits are the backend's.
const optionalText = z.string().trim().max(TEST_CASE_TEXT_MAX_LENGTH, { message: 'validation.textMaxLength' });

const stepText = (requiredMessage: string) => z.string()
    .trim()
    .min(1, { message: requiredMessage })
    .max(TEST_STEP_TEXT_MAX_LENGTH, { message: 'validation.stepTextMaxLength' });

export const testCaseFormSchema = z.object({
    title: z.string()
        .trim()
        .min(1, { message: 'validation.titleRequired' })
        .max(TEST_CASE_TITLE_MAX_LENGTH, { message: 'validation.titleMaxLength' }),
    description: optionalText,
    priority: z.enum(TEST_CASE_PRIORITIES, { message: 'validation.priorityRequired' }),
    type: z.enum(TEST_TYPES, { message: 'validation.typeRequired' }),
    preConditions: optionalText,
    postConditions: optionalText,
    // The API lowercases and merges tags; the field already does (what you see is what gets saved).
    // Commas separate tags in the list filter, so a tag can't contain one.
    tags: z.array(z.string()
        .trim()
        .min(1)
        .max(TEST_CASE_TAG_MAX_LENGTH, { message: 'validation.tagMaxLength' })
        .refine((tag) => !tag.includes(','), { message: 'validation.tagComma' }))
        .max(TEST_CASE_TAGS_MAX, { message: 'validation.tagsMax' }),
    // The array order is the step order.
    steps: z.array(z.object({
        action: stepText('validation.actionRequired'),
        expectedResult: stepText('validation.expectedResultRequired'),
    }))
        .min(1, { message: 'validation.stepsRequired' })
        .max(TEST_STEPS_MAX, { message: 'validation.stepsMax' }),
    suiteIds: z.array(z.number()).max(TEST_CASE_SUITES_MAX, { message: 'validation.suitesMax' }),
});
