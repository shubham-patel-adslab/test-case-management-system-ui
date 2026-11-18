import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { App } from 'antd';

import { UserForm } from '../components/UserForm';
import { createUser, getRoles, getUser, updateUser } from '../user.api';
import { toRole, toUserCreateRequestDto, toUserDetails, toUserFormValues, toUserUpdateRequestDto } from '../user.mapper';
import type { UserFormType } from '../user.type';
import { useAuth } from '../../auth/auth.context';
import { API_ERROR_CODE, getApiErrorCode } from '../../../app/api-error';
import { FORM_EXIT_NAVIGATION } from '../../../shared/components/form/FormActions';
import { PageHeader } from '../../../shared/components/PageHeader';
import { QueryErrorState } from '../../../shared/components/QueryErrorState';
import { QueryLoadingState } from '../../../shared/components/QueryLoadingState';

export function UserFormPage() {
    const navigate = useNavigate();

    const { t } = useTranslation('user');
    const { message } = App.useApp();
    const queryClient = useQueryClient();
    const { session } = useAuth();

    const { userId } = useParams();
    const isUpdateMode = userId !== undefined;

    const userQuery = useQuery({
        queryKey: ['users', 'detail', userId],
        queryFn: ({ signal }) => getUser(userId!, signal),
        enabled: isUpdateMode,
    });

    const rolesQuery = useQuery({
        queryKey: ['roles'],
        queryFn: ({ signal }) => getRoles(signal),
    });

    const createUserMutation = useMutation({ mutationFn: createUser });
    const updateUserMutation = useMutation({ mutationFn: updateUser });

    const handleSubmit = async (data: UserFormType) => {
        try {
            const user = isUpdateMode
                ? await updateUserMutation.mutateAsync(toUserUpdateRequestDto({ id: userId, ...data }))
                : await createUserMutation.mutateAsync(toUserCreateRequestDto(data));

            await queryClient.invalidateQueries({ queryKey: ['users'] });

            message.success(isUpdateMode
                ? t('notifications.updateSuccess')
                : t('notifications.inviteSuccess', { email: user.email }));

            void navigate(`/users/${user.id}`, FORM_EXIT_NAVIGATION);
        } catch (error) {
            const code = getApiErrorCode(error);

            if (code === API_ERROR_CODE.CONFLICT) {
                // Duplicate email: stay on the form with the data kept.
                message.error(t('notifications.emailInUse'));
                return;
            }

            if (code === API_ERROR_CODE.EMAIL_DELIVERY_FAILED) {
                // The change is saved; only the invitation email failed. A failed create returns no user id,
                // so go back to the list.
                await queryClient.invalidateQueries({ queryKey: ['users'] });
                message.warning(isUpdateMode ? t('notifications.updatedEmailFailed') : t('notifications.createdEmailFailed'));
                void navigate(isUpdateMode ? `/users/${userId}` : '/users', FORM_EXIT_NAVIGATION);
                return;
            }

            console.error('Failed to save user:', error);
            message.error(t('notifications.saveError'));
        }
    };

    if (userQuery.isError || rolesQuery.isError) {
        return (
            <QueryErrorState
                onRetry={() => {
                    void rolesQuery.refetch();
                    if (isUpdateMode) {
                        void userQuery.refetch();
                    }
                }}
            />
        );
    }

    if (!rolesQuery.data || (isUpdateMode && !userQuery.data)) {
        return <QueryLoadingState />;
    }

    const defaultValues: UserFormType | undefined = userQuery.data
        ? toUserFormValues(toUserDetails(userQuery.data))
        : undefined;

    const isSubmitting = createUserMutation.isPending || updateUserMutation.isPending;

    return (
        <>
            <PageHeader title={isUpdateMode ? t('page.updateTitle') : t('page.createTitle')} />
            <UserForm
                defaultValues={defaultValues}
                roles={rolesQuery.data.map(toRole)}
                isRoleLocked={isUpdateMode && session?.user.id === userId}
                onSubmit={handleSubmit}
                // Back to where the user came from: the user for an update, the list for an invite.
                onCancel={() => void navigate(isUpdateMode ? `/users/${userId}` : '/users', FORM_EXIT_NAVIGATION)}
                isSubmitting={isSubmitting}
            />
        </>
    );
}
