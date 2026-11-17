import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Form } from 'antd';

import { projectFormSchema } from '../project.schema';
import { PROJECT_STATUSES } from '../project.constant';
import type { ProjectFormType, ProjectMemberType } from '../project.type';
import { ProjectMemberSelect } from './ProjectMemberSelect';
import { FormTextField } from '../../../shared/components/form/FormTextField';
import { FormTextAreaField } from '../../../shared/components/form/FormTextAreaField';
import { FormSelectField } from '../../../shared/components/form/FormSelectField';
import { FormActions } from '../../../shared/components/form/FormActions';

// Create mode starts from these: every field needs a defined value for the zod string checks,
// and new projects start out active. The team starts as `initialMembers`.
const CREATE_DEFAULT_VALUES: Omit<ProjectFormType, 'memberIds'> = {
    name: '',
    description: '',
    version: '',
    status: 'ACTIVE',
};

type ProjectFormProps = {
    defaultValues?: ProjectFormType;
    // The team as loaded on update; on create, whoever starts on it (the creator, when locked).
    initialMembers: ProjectMemberType[];
    // A member the user can't remove (themselves, when they only see their own projects).
    lockedMemberId?: string;
    onSubmit: (data: ProjectFormType) => void | Promise<void>;
    // Leaves the form without saving; the page decides where to go.
    onCancel: () => void;
    isSubmitting: boolean;
};

export function ProjectForm({
    defaultValues,
    initialMembers,
    lockedMemberId,
    onSubmit,
    onCancel,
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
        defaultValues: defaultValues ?? {
            ...CREATE_DEFAULT_VALUES,
            memberIds: initialMembers.map((member) => member.id),
        },
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

                <ProjectMemberSelect
                    control={control}
                    initialMembers={initialMembers}
                    lockedMemberId={lockedMemberId}
                    errorMessage={errors.memberIds?.message}
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
