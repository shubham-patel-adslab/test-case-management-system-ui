import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Form } from 'antd';

import { userFormSchema } from '../user.schema';
import type { RoleType, UserFormType } from '../user.type';
import { FormTextField } from '../../../shared/components/form/FormTextField';
import { FormSelectField } from '../../../shared/components/form/FormSelectField';
import { FormActions } from '../../../shared/components/form/FormActions';

const CREATE_DEFAULT_VALUES: UserFormType = {
    firstName: '',
    lastName: '',
    email: '',
    // No role preselected: the admin always chooses one (required, by the API too).
    roleCode: '',
};

type UserFormProps = {
    defaultValues?: UserFormType;
    roles: RoleType[];
    // The signed-in admin's own account: the API refuses a self role change.
    isRoleLocked: boolean;
    onSubmit: (data: UserFormType) => void | Promise<void>;
    // Leaves the form without saving; the page decides where to go.
    onCancel: () => void;
    isSubmitting: boolean;
};

export function UserForm({
    defaultValues,
    roles,
    isRoleLocked,
    onSubmit,
    onCancel,
    isSubmitting,
}: UserFormProps) {
    const { t } = useTranslation('user');
    const isUpdateMode = !!defaultValues;

    const {
        control,
        handleSubmit,
        formState: { errors, isDirty },
    } = useForm<UserFormType>({
        resolver: zodResolver(userFormSchema),
        defaultValues: defaultValues ?? CREATE_DEFAULT_VALUES,
    });

    // Create: always submittable (until in flight). Update: nothing to save until the form actually changes.
    const isSubmitDisabled = isSubmitting || (isUpdateMode && !isDirty);

    const roleOptions = roles.map((role) => ({ value: role.code, label: role.name }));

    return (
        // Layout only — react-hook-form + zod remain the single source of truth for values and validation.
        <form onSubmit={(event) => { void handleSubmit(onSubmit)(event); }}>
            <Form layout="vertical" component={false}>
                <FormTextField
                    name="firstName"
                    label={t('form.firstNameLabel')}
                    control={control}
                    error={errors.firstName}
                    t={t}
                    required
                />

                <FormTextField
                    name="lastName"
                    label={t('form.lastNameLabel')}
                    control={control}
                    error={errors.lastName}
                    t={t}
                />

                <FormTextField
                    name="email"
                    label={t('form.emailLabel')}
                    control={control}
                    error={errors.email}
                    t={t}
                    type="email"
                    required
                />

                <FormSelectField
                    name="roleCode"
                    label={t('form.roleLabel')}
                    control={control}
                    options={roleOptions}
                    error={errors.roleCode}
                    t={t}
                    placeholder={t('form.rolePlaceholder')}
                    required
                    disabled={isRoleLocked}
                    extra={isRoleLocked ? t('form.ownRoleLocked') : undefined}
                />

                <FormActions
                    submitLabel={isUpdateMode ? t('form.submitUpdate') : t('form.submitInvite')}
                    isSubmitting={isSubmitting}
                    isSubmitDisabled={isSubmitDisabled}
                    isDirty={isDirty}
                    onCancel={onCancel}
                />
            </Form>
        </form>
    );
}
