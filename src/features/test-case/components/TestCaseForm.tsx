import { useCallback } from 'react';
import { Controller, useForm, type FieldError, type Merge } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Col, Form, Row, Select } from 'antd';

import { TestCaseStepsField } from './TestCaseStepsField';
import { testCaseFormSchema } from '../test-case.schema';
import { TEST_CASE_PRIORITIES, TEST_TYPES } from '../test-case.constant';
import type { TestCaseFormServerError, TestCaseFormType } from '../test-case.type';
import type { TestSuiteOption } from '../../test-suite/useTestSuiteOptions';
import { FormActions } from '../../../shared/components/form/FormActions';
import { FormSelectField } from '../../../shared/components/form/FormSelectField';
import { FormTextAreaField } from '../../../shared/components/form/FormTextAreaField';
import { FormTextField } from '../../../shared/components/form/FormTextField';

// A new test case starts with one empty step (at least one is required) and the most common choices.
const CREATE_DEFAULT_VALUES: TestCaseFormType = {
    title: '',
    description: '',
    priority: 'MEDIUM',
    type: 'FUNCTIONAL',
    preConditions: '',
    postConditions: '',
    tags: [],
    steps: [{ action: '', expectedResult: '' }],
    suiteIds: [],
};

type TestCaseFormProps = {
    defaultValues?: TestCaseFormType;
    suiteOptions: TestSuiteOption[];
    isSuitesLoading: boolean;
    hasSuitesError: boolean;
    // Resolves with the API's field errors when the save was rejected, so the form can show them.
    onSubmit: (data: TestCaseFormType) => Promise<TestCaseFormServerError[] | undefined>;
    // Leaves the form without saving; the page decides where to go.
    onCancel: () => void;
    isSubmitting: boolean;
};

// The API lowercases, trims and merges tags; the field does the same, so what you see is what gets saved.
function normalizeTags(tags: string[]): string[] {
    return [...new Set(tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean))];
}

// Errors of a list field come either for the list ("at most 20 tags") or for one item ("at most 50
// characters"); show the first.
function getFirstErrorMessage(error: Merge<FieldError, (FieldError | undefined)[]> | undefined): string | undefined {
    if (!error || error.message) {
        return error?.message;
    }

    return Array.from({ length: error.length ?? 0 }, (_, index) => error[index]?.message).find(Boolean);
}

export function TestCaseForm({
    defaultValues,
    suiteOptions,
    isSuitesLoading,
    hasSuitesError,
    onSubmit,
    onCancel,
    isSubmitting,
}: TestCaseFormProps) {
    const { t } = useTranslation('testCase');
    const isUpdateMode = !!defaultValues;

    const {
        control,
        handleSubmit,
        setError,
        formState: { errors, isDirty },
    } = useForm<TestCaseFormType>({
        resolver: zodResolver(testCaseFormSchema),
        defaultValues: defaultValues ?? CREATE_DEFAULT_VALUES,
    });

    // useCallback written explicitly (PRD Frontend Req §1: test case form handlers), although the React
    // Compiler would memoize it too.
    const submitForm = useCallback(async (data: TestCaseFormType) => {
        const serverErrors = await onSubmit(data);

        serverErrors?.forEach(({ name, message }) => setError(name, { type: 'server', message }));
    }, [onSubmit, setError]);

    // Create: always submittable (until in flight). Update: nothing to save until the form actually changes.
    const isSubmitDisabled = isSubmitting || (isUpdateMode && !isDirty);

    const priorityOptions = TEST_CASE_PRIORITIES.map((priority) => ({ value: priority, label: t(`priority.${priority}`) }));
    const typeOptions = TEST_TYPES.map((type) => ({ value: type, label: t(`type.${type}`) }));

    const tagsError = getFirstErrorMessage(errors.tags);
    const suitesError = getFirstErrorMessage(errors.suiteIds);

    return (
        // Layout only — react-hook-form + zod remain the single source of truth for values and validation.
        <form onSubmit={(event) => { void handleSubmit(submitForm)(event); }}>
            <Form layout="vertical" component={false}>
                <FormTextField name="title" label={t('form.titleLabel')} control={control} error={errors.title} t={t} required />

                <Row gutter={16}>
                    <Col xs={24} md={12}>
                        <FormSelectField
                            name="priority"
                            label={t('form.priorityLabel')}
                            control={control}
                            options={priorityOptions}
                            error={errors.priority}
                            t={t}
                            required
                        />
                    </Col>
                    <Col xs={24} md={12}>
                        <FormSelectField
                            name="type"
                            label={t('form.typeLabel')}
                            control={control}
                            options={typeOptions}
                            error={errors.type}
                            t={t}
                            required
                        />
                    </Col>
                </Row>

                <FormTextAreaField
                    name="description"
                    label={t('form.descriptionLabel')}
                    control={control}
                    error={errors.description}
                    t={t}
                />

                <Row gutter={16}>
                    <Col xs={24} md={12}>
                        <FormTextAreaField
                            name="preConditions"
                            label={t('form.preConditionsLabel')}
                            control={control}
                            error={errors.preConditions}
                            t={t}
                        />
                    </Col>
                    <Col xs={24} md={12}>
                        <FormTextAreaField
                            name="postConditions"
                            label={t('form.postConditionsLabel')}
                            control={control}
                            error={errors.postConditions}
                            t={t}
                        />
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col xs={24} md={12}>
                        <Form.Item
                            label={t('form.tagsLabel')}
                            htmlFor="tags"
                            validateStatus={tagsError ? 'error' : ''}
                            help={tagsError ? t(tagsError) : t('form.tagsHelp')}
                        >
                            <Controller
                                name="tags"
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        id="tags"
                                        mode="tags"
                                        // Free-form: there's no list of existing tags to pick from.
                                        open={false}
                                        tokenSeparators={[',']}
                                        placeholder={t('form.tagsPlaceholder')}
                                        value={field.value}
                                        onChange={(tags: string[]) => field.onChange(normalizeTags(tags))}
                                        onBlur={field.onBlur}
                                        ref={field.ref}
                                    />
                                )}
                            />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                        <Form.Item
                            label={t('form.suitesLabel')}
                            htmlFor="suiteIds"
                            validateStatus={suitesError || hasSuitesError ? 'error' : ''}
                            help={(suitesError && t(suitesError)) || (hasSuitesError && t('form.suitesLoadError'))}
                        >
                            <Controller
                                name="suiteIds"
                                control={control}
                                render={({ field }) => (
                                    <Select<number[]>
                                        id="suiteIds"
                                        mode="multiple"
                                        allowClear
                                        showSearch={{ optionFilterProp: 'label' }}
                                        placeholder={t('form.suitesPlaceholder')}
                                        loading={isSuitesLoading}
                                        disabled={hasSuitesError}
                                        options={suiteOptions}
                                        value={field.value}
                                        onChange={field.onChange}
                                        onBlur={field.onBlur}
                                        ref={field.ref}
                                    />
                                )}
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <TestCaseStepsField control={control} errors={errors} />

                <FormActions
                    submitLabel={t('form.submit')}
                    isSubmitting={isSubmitting}
                    isSubmitDisabled={isSubmitDisabled}
                    isDirty={isDirty}
                    onCancel={onCancel}
                />
            </Form>
        </form>
    );
}
