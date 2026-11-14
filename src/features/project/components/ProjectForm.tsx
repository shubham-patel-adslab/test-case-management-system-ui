import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Button, Form } from 'antd';

import { projectFormSchema } from '../project.schema';
import { PROJECT_STATUSES } from '../project.constant';
import type { ProjectFormType } from '../project.type';
import { FormTextField } from '../../../shared/components/form/FormTextField';
import { FormTextAreaField } from '../../../shared/components/form/FormTextAreaField';
import { FormSelectField } from '../../../shared/components/form/FormSelectField';

// Create mode starts from these: every field needs a defined value for the zod string checks,
// and new projects start out active.
const CREATE_DEFAULT_VALUES: ProjectFormType = {
    name: '',
    description: '',
    version: '',
    status: 'active',
};

type ProjectFormProps = {
    defaultValues?: ProjectFormType;
    onSubmit: (data: ProjectFormType) => void | Promise<void>;
    isSubmitting: boolean;
};

export function ProjectForm({
    defaultValues,
    onSubmit,
    isSubmitting
}: ProjectFormProps) {
    const { t } = useTranslation('project');
    const isUpdateMode = !!defaultValues;

    const {
        control,
        handleSubmit,
        formState: { errors, isDirty },
    } = useForm<ProjectFormType>({
        resolver: zodResolver(projectFormSchema),
        defaultValues: defaultValues ?? CREATE_DEFAULT_VALUES,
    });

    // Create: always submittable (until in flight). Update: nothing to save until the form actually changes.
    const isSubmitDisabled = isSubmitting || (isUpdateMode && !isDirty);

    const statusOptions = PROJECT_STATUSES.map((status) => ({
        value: status,
        label: t(`status.${status}`),
    }));

    return (
        // Layout only — react-hook-form + zod remain the single source of truth for values and
        // validation, so this stays a plain <form> rather than antd's own Form/onFinish state.
        <form onSubmit={(event) => { void handleSubmit(onSubmit)(event); }}>
            <Form layout="vertical" component={false}>
                <FormTextField
                    name="name"
                    label={t('form.nameLabel')}
                    control={control}
                    error={errors.name}
                    t={t}
                    required
                />

                <FormTextField
                    name="version"
                    label={t('form.versionLabel')}
                    control={control}
                    error={errors.version}
                    t={t}
                />

                <FormSelectField
                    name="status"
                    label={t('form.statusLabel')}
                    control={control}
                    options={statusOptions}
                    error={errors.status}
                    t={t}
                    required
                />

                <FormTextAreaField
                    name="description"
                    label={t('form.descriptionLabel')}
                    control={control}
                    error={errors.description}
                    t={t}
                />

                <Form.Item>
                    <Button type="primary" htmlType="submit" loading={isSubmitting} disabled={isSubmitDisabled}>
                        {t('form.submit')}
                    </Button>
                </Form.Item>
            </Form>
        </form>
    );
}
