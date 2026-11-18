import { memo } from 'react';
import { Controller, type Control, type FieldErrors } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Card, Col, Form, Input, Row, Select, Typography } from 'antd';

import styles from './ExecutionResultForm.module.scss';
import type { ExecutionResultFormInputType, TestExecutionStepType } from '../test-execution.type';
import { EXECUTION_RESULTS } from '../../test-case/test-case.constant';

type ExecutionStepRowProps = {
    index: number;
    step: TestExecutionStepType;
    control: Control<ExecutionResultFormInputType>;
    errors: FieldErrors<ExecutionResultFormInputType>['steps'];
};

// One step of a run: what to do, what should happen, and an optional result + comment. Memoized
// (PRD Frontend Req §1: prevent unnecessary re-renders in test execution components) — a long run has many
// steps, and editing one step's comment shouldn't re-render the others.
export const ExecutionStepRow = memo(function ExecutionStepRow({ index, step, control, errors }: ExecutionStepRowProps) {
    const { t } = useTranslation('testExecution');
    const { t: tTestCase } = useTranslation('testCase');
    const number = index + 1;
    const commentError = errors?.[index]?.comment?.message;

    return (
        <Card size="small" title={t('form.stepLabel', { number })}>
            <Row gutter={16}>
                <Col xs={24} md={12}>
                    <Typography.Text type="secondary">{t('form.actionLabel')}</Typography.Text>
                    <Typography.Paragraph className={styles['tb-execution-form__text']}>{step.action}</Typography.Paragraph>
                </Col>
                <Col xs={24} md={12}>
                    <Typography.Text type="secondary">{t('form.expectedResultLabel')}</Typography.Text>
                    <Typography.Paragraph className={styles['tb-execution-form__text']}>{step.expectedResult}</Typography.Paragraph>
                </Col>
            </Row>
            <Row gutter={16}>
                <Col xs={24} md={8}>
                    <Form.Item className={styles['tb-execution-form__step-field']}>
                        <Controller
                            name={`steps.${index}.status`}
                            control={control}
                            render={({ field }) => (
                                <Select
                                    aria-label={t('form.stepResultLabel', { number })}
                                    placeholder={t('form.stepResultPlaceholder')}
                                    allowClear
                                    options={EXECUTION_RESULTS.map((result) => ({ value: result, label: tTestCase(`result.${result}`) }))}
                                    value={field.value ?? undefined}
                                    onChange={(value) => field.onChange(value ?? null)}
                                    onBlur={field.onBlur}
                                />
                            )}
                        />
                    </Form.Item>
                </Col>
                <Col xs={24} md={16}>
                    <Form.Item
                        className={styles['tb-execution-form__step-field']}
                        validateStatus={commentError ? 'error' : ''}
                        help={commentError && t(commentError)}
                    >
                        <Controller
                            name={`steps.${index}.comment`}
                            control={control}
                            render={({ field }) => (
                                <Input
                                    aria-label={t('form.stepCommentLabel', { number })}
                                    placeholder={t('form.stepCommentPlaceholder')}
                                    {...field}
                                />
                            )}
                        />
                    </Form.Item>
                </Col>
            </Row>
        </Card>
    );
});
