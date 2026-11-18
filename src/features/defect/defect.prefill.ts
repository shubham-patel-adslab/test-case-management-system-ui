import type { TFunction } from 'i18next';

import { DEFECT_DESCRIPTION_MAX_LENGTH, DEFECT_TITLE_MAX_LENGTH } from './defect.constant';
import type { DefectFormType } from './defect.type';

// What a failed run knows that a defect needs (ui-requirements §4.4: title from the test case, steps to
// reproduce from the steps).
export type FailedRunForDefect = {
    testCaseTitle: string;
    comment: string;
    steps: { order: number; action: string; expectedResult: string; status: string | null; comment: string }[];
};

// The form's starting values: "Failed: <test case>", the steps to reproduce (in the API's step order) with the failed one marked and
// their comments, then the run's comment. Cut to the API's limits; the user edits from there.
export function toDefectFormPrefill(run: FailedRunForDefect, t: TFunction): DefectFormType {
    const steps = run.steps.flatMap((step) => [
        `${step.order}. ${step.action}${step.status === 'FAIL' ? `  ${t('form.prefillFailed')}` : ''}`,
        `   ${t('form.prefillExpected', { expected: step.expectedResult })}`,
        ...(step.comment ? [`   ${t('form.prefillComment', { comment: step.comment })}`] : []),
    ]);
    const description = [
        t('form.prefillSteps'),
        ...steps,
        ...(run.comment ? ['', t('form.prefillResult', { comment: run.comment })] : []),
    ].join('\n');

    return {
        title: t('form.prefillTitle', { title: run.testCaseTitle }).slice(0, DEFECT_TITLE_MAX_LENGTH),
        description: description.slice(0, DEFECT_DESCRIPTION_MAX_LENGTH),
        severity: 'MEDIUM',
    };
}
