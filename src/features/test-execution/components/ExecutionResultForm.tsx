import { useCallback } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Button, Card, Flex, Form, Radio, Typography } from 'antd';

import styles from './ExecutionResultForm.module.scss';
import { ExecutionStepRow } from './ExecutionStepRow';
import { toExecutionResultFormValues } from '../test-execution.mapper';
import { executionResultFormSchema } from '../test-execution.schema';
import type { ExecutionResultFormInputType, ExecutionResultFormType, TestExecutionStepType } from '../test-execution.type';
import { EXECUTION_RESULTS } from '../../test-case/test-case.constant';
import { FormActions } from '../../../shared/components/form/FormActions';
import { FormTextAreaField } from '../../../shared/components/form/FormTextAreaField';

type ExecutionResultFormProps = {
    // The steps to run, in order.
    steps: TestExecutionStepType[];
    // From the test case (current version); undefined when it's unknown (e.g. the test case was deleted).
    preConditions?: string;
    postConditions?: string;
    // Set when the user may only look (a role without TEST_EXECUTION UPDATE/CREATE): the form is shown
    // disabled, with this as the reason (ui-requirements §2 rule 3).
    readOnlyReason?: string;
    onSubmit: (form: ExecutionResultFormType) => Promise<void>;
    onCancel: () => void;
    isSubmitting: boolean;
};

// Record the result of a run (pending or ad hoc): an overall result, an optional comment, and optional
// per-step results (ui-requirements §4.4).
export function ExecutionResultForm({
    steps,
    preConditions,
    postConditions,
    readOnlyReason,
    onSubmit,
    onCancel,
    isSubmitting,
}: ExecutionResultFormProps) {
    const { t } = useTranslation('testExecution');
    const { t: tTestCase } = useTranslation('testCase');

    // The form edits a nullable result; the schema's output has a definite one.
    const {
        control,
        handleSubmit,
        setValue,
        formState: { errors, isDirty },
    } = useForm<ExecutionResultFormInputType, unknown, ExecutionResultFormType>({
        resolver: zodResolver(executionResultFormSchema),
        defaultValues: toExecutionResultFormValues(steps),
    });

    // useCallback written explicitly (PRD Frontend Req §1: handlers in test execution components), although
    // the React Compiler would memoize it too.
    const markAllStepsPassed = useCallback(() => {
        steps.forEach((_, index) => setValue(`steps.${index}.status`, 'PASS', { shouldDirty: true }));
    }, [steps, setValue]);

    const statusError = errors.status?.message;
    const conditionsText = (text: string) => <Typography.Paragraph className={styles['tb-execution-form__text']}>{text}</Typography.Paragraph>;

    return (
        // Layout only — react-hook-form + zod remain the single source of truth for values and validation.
        <form onSubmit={(event) => { void handleSubmit(onSubmit)(event); }}>
            <Form layout="vertical" component={false} disabled={!!readOnlyReason}>
                <Flex vertical gap="middle">
                    {preConditions && (
                        <Card size="small" title={t('form.preConditionsLabel')}>{conditionsText(preConditions)}</Card>
                    )}

                    <Flex justify="space-between" align="center" wrap gap="small">
                        <Typography.Title level={4} className={styles['tb-execution-form__title']}>{t('form.stepsTitle')}</Typography.Title>
                        <Button onClick={markAllStepsPassed}>{t('form.markAllPassed')}</Button>
                    </Flex>
                    {steps.map((step, index) => (
                        <ExecutionStepRow key={step.order} index={index} step={step} control={control} errors={errors.steps} />
                    ))}

                    {postConditions && (
                        <Card size="small" title={t('form.postConditionsLabel')}>{conditionsText(postConditions)}</Card>
                    )}

                    <div>
                        <Form.Item
                            label={t('form.resultLabel')}
                            required
                            validateStatus={statusError ? 'error' : ''}
                            help={statusError && t(statusError)}
                        >
                            <Controller
                                name="status"
                                control={control}
                                render={({ field }) => (
                                    <Radio.Group
                                        aria-label={t('form.resultLabel')}
                                        optionType="button"
                                        buttonStyle="solid"
                                        options={EXECUTION_RESULTS.map((result) => ({ value: result, label: tTestCase(`result.${result}`) }))}
                                        value={field.value}
                                        onChange={(event) => field.onChange(event.target.value)}
                                    />
                                )}
                            />
                        </Form.Item>

                        <FormTextAreaField name="comment" label={t('form.commentLabel')} control={control} error={errors.comment} t={t} />

                        <FormActions
                            submitLabel={t('form.submit')}
                            isSubmitting={isSubmitting}
                            isSubmitDisabled={isSubmitting || !!readOnlyReason}
                            isDirty={isDirty}
                            onCancel={onCancel}
                            submitTooltip={readOnlyReason}
                        />
                    </div>
                </Flex>
            </Form>
        </form>
    );
}
