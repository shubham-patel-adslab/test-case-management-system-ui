import { z } from 'zod';

import { TEST_SUITE_DESCRIPTION_MAX_LENGTH, TEST_SUITE_NAME_MAX_LENGTH } from './test-suite.constant';

// Messages are i18next keys (namespace 'testSuite'). Trimmed before the checks (ui-requirements §5.5).
export const testSuiteFormSchema = z.object({
    name: z.string()
        .trim()
        .min(1, { message: 'validation.nameRequired' })
        .max(TEST_SUITE_NAME_MAX_LENGTH, { message: 'validation.nameMaxLength' }),
    description: z.string()
        .trim()
        .max(TEST_SUITE_DESCRIPTION_MAX_LENGTH, { message: 'validation.descriptionMaxLength' }),
});
