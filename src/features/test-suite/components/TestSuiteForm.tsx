import { useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Form } from 'antd';

import { testSuiteFormSchema } from '../test-suite.schema';
import type { TestSuiteFormServerError, TestSuiteFormType } from '../test-suite.type';
import { FormActions } from '../../../shared/components/form/FormActions';
import { FormTextAreaField } from '../../../shared/components/form/FormTextAreaField';
import { FormTextField } from '../../../shared/components/form/FormTextField';

const CREATE_DEFAULT_VALUES: TestSuiteFormType = { name: '', description: '' };

type TestSuiteFormProps = {
    defaultValues?: TestSuiteFormType;
    // Resolves with the API's field errors when the save was rejected (a taken name), so the form shows them.
    onSubmit: (data: TestSuiteFormType) => Promise<TestSuiteFormServerError[] | undefined>;
    // Leaves the form without saving; the page decides where to go.
    onCancel: () => void;
    isSubmitting: boolean;
};

export function TestSuiteForm({ defaultValues, onSubmit, onCancel, isSubmitting }: TestSuiteFormProps) {
    const { t } = useTranslation('testSuite');
    const isUpdateMode = !!defaultValues;

    const {
        control,
        handleSubmit,
        setError,
        formState: { errors, isDirty },
    } = useForm<TestSuiteFormType>({
        resolver: zodResolver(testSuiteFormSchema),
        defaultValues: defaultValues ?? CREATE_DEFAULT_VALUES,
    });

    const submitForm = useCallback(async (data: TestSuiteFormType) => {
        const serverErrors = await onSubmit(data);

        serverErrors?.forEach(({ name, message }) => setError(name, { type: 'server', message }));
    }, [onSubmit, setError]);

    // Create: always submittable (until in flight). Update: nothing to save until the form actually changes.
    const isSubmitDisabled = isSubmitting || (isUpdateMode && !isDirty);

    return (
        // Layout only — react-hook-form + zod remain the single source of truth for values and validation.
        <form onSubmit={(event) => { void handleSubmit(submitForm)(event); }}>
            <Form layout="vertical" component={false}>
                <FormTextField name="name" label={t('form.nameLabel')} control={control} error={errors.name} t={t} required />
                <FormTextAreaField
                    name="description"
                    label={t('form.descriptionLabel')}
                    control={control}
                    error={errors.description}
                    t={t}
                />
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
