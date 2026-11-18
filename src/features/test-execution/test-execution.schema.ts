import { z } from 'zod';

import { EXECUTION_COMMENT_MAX_LENGTH, EXECUTION_STEP_COMMENT_MAX_LENGTH } from './test-execution.constant';
import { EXECUTION_RESULTS } from '../test-case/test-case.constant';

// Messages are i18next keys (namespace 'testExecution'). Results are optional per step; the overall result
// is required — edited as null until picked, so the output type is a definite result.
export const executionResultFormSchema = z.object({
    status: z.enum(EXECUTION_RESULTS).nullable().transform((status, context) => {
        if (status === null) {
            context.addIssue({ code: 'custom', message: 'validation.resultRequired' });
            return z.NEVER;
        }

        return status;
    }),
    comment: z.string().trim().max(EXECUTION_COMMENT_MAX_LENGTH, { message: 'validation.commentMaxLength' }),
    // One entry per step, in step order (index + 1 = the step's `order`).
    steps: z.array(z.object({
        status: z.enum(EXECUTION_RESULTS).nullable(),
        comment: z.string().trim().max(EXECUTION_STEP_COMMENT_MAX_LENGTH, { message: 'validation.stepCommentMaxLength' }),
    })),
}).refine(
    // The backend's rule: a run with a failed step can't pass.
    (form) => !(form.status === 'PASS' && form.steps.some((step) => step.status === 'FAIL')),
    { path: ['status'], message: 'validation.passWithFailedStep' },
);
