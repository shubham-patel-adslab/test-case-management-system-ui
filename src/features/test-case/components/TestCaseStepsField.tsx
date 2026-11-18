import { useCallback } from 'react';
import { useFieldArray, type Control, type FieldErrors } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ArrowDownOutlined, ArrowUpOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Card, Col, Flex, Form, Row, Tooltip } from 'antd';

import { TEST_STEPS_MAX } from '../test-case.constant';
import type { TestCaseFormType } from '../test-case.type';
import { FormTextAreaField } from '../../../shared/components/form/FormTextAreaField';

const STEP_TEXT_ROWS = 2;
const EMPTY_STEP = { action: '', expectedResult: '' };

type TestCaseStepsFieldProps = {
    control: Control<TestCaseFormType>;
    errors: FieldErrors<TestCaseFormType>;
};

// The ordered steps: add, remove, move up/down. The array order is the step order the API stores.
export function TestCaseStepsField({ control, errors }: TestCaseStepsFieldProps) {
    const { t } = useTranslation('testCase');
    const { fields, append, remove, move } = useFieldArray({ control, name: 'steps' });

    // useCallback written explicitly (PRD Frontend Req §1: test case form handlers), although the React
    // Compiler would memoize these too. append/remove/move are stable, so the handlers are as well.
    const handleAddStep = useCallback(() => append(EMPTY_STEP), [append]);
    const handleRemoveStep = useCallback((index: number) => remove(index), [remove]);
    const handleMoveStep = useCallback((from: number, to: number) => move(from, to), [move]);

    // "At least one step" / "at most 100" — on the array, not on a step.
    const stepsError = errors.steps?.message ?? errors.steps?.root?.message;

    return (
        <Form.Item
            label={t('form.stepsLabel')}
            required
            validateStatus={stepsError ? 'error' : ''}
            help={stepsError && t(stepsError)}
        >
            <Flex vertical gap="small">
                {fields.map((field, index) => {
                    const number = index + 1;

                    return (
                        <Card
                            key={field.id}
                            size="small"
                            title={t('form.stepLabel', { number })}
                            extra={(
                                <Flex gap={4}>
                                    <Tooltip title={t('form.moveStepUp', { number })}>
                                        <Button
                                            type="text"
                                            size="small"
                                            icon={<ArrowUpOutlined />}
                                            aria-label={t('form.moveStepUp', { number })}
                                            disabled={index === 0}
                                            onClick={() => handleMoveStep(index, index - 1)}
                                        />
                                    </Tooltip>
                                    <Tooltip title={t('form.moveStepDown', { number })}>
                                        <Button
                                            type="text"
                                            size="small"
                                            icon={<ArrowDownOutlined />}
                                            aria-label={t('form.moveStepDown', { number })}
                                            disabled={index === fields.length - 1}
                                            onClick={() => handleMoveStep(index, index + 1)}
                                        />
                                    </Tooltip>
                                    <Tooltip title={t('form.removeStep', { number })}>
                                        <Button
                                            type="text"
                                            size="small"
                                            danger
                                            icon={<DeleteOutlined />}
                                            aria-label={t('form.removeStep', { number })}
                                            // A test case needs at least one step.
                                            disabled={fields.length === 1}
                                            onClick={() => handleRemoveStep(index)}
                                        />
                                    </Tooltip>
                                </Flex>
                            )}
                        >
                            <Row gutter={16}>
                                <Col xs={24} md={12}>
                                    <FormTextAreaField
                                        name={`steps.${index}.action`}
                                        label={t('form.actionLabel')}
                                        control={control}
                                        error={errors.steps?.[index]?.action}
                                        t={t}
                                        required
                                        rows={STEP_TEXT_ROWS}
                                    />
                                </Col>
                                <Col xs={24} md={12}>
                                    <FormTextAreaField
                                        name={`steps.${index}.expectedResult`}
                                        label={t('form.expectedResultLabel')}
                                        control={control}
                                        error={errors.steps?.[index]?.expectedResult}
                                        t={t}
                                        required
                                        rows={STEP_TEXT_ROWS}
                                    />
                                </Col>
                            </Row>
                        </Card>
                    );
                })}
                <Button
                    type="dashed"
                    icon={<PlusOutlined />}
                    onClick={handleAddStep}
                    disabled={fields.length >= TEST_STEPS_MAX}
                >
                    {t('form.addStep')}
                </Button>
            </Flex>
        </Form.Item>
    );
}
