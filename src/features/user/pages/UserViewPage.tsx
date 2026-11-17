import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App, Button, Descriptions, Popconfirm, Tooltip } from 'antd';

import { UserStatusTag } from '../components/UserStatusTag';
import { getUser, resendInvitation, updateUserStatus } from '../user.api';
import { toUserDetails } from '../user.mapper';
import type { UserSettableStatus } from '../user.type';
import { useAuth } from '../../auth/auth.context';
import { PERMISSION_CODE, RESOURCE_CODE } from '../../auth/auth.constant';
import { API_ERROR_CODE, getApiErrorCode } from '../../../app/api-error';
import { PageHeader } from '../../../shared/components/PageHeader';
import { QueryErrorState } from '../../../shared/components/QueryErrorState';
import { QueryLoadingState } from '../../../shared/components/QueryLoadingState';
import { formatDateTime } from '../../../shared/format/date.format';
import { formatFullName } from '../../../shared/format/name.format';

const EMPTY_VALUE = '—';

export function UserViewPage() {
    const { t } = useTranslation('user');
    const navigate = useNavigate();
    const { message } = App.useApp();
    const queryClient = useQueryClient();
    const { session, can } = useAuth();

    const { userId } = useParams();

    const userQuery = useQuery({
        queryKey: ['users', 'detail', userId],
        queryFn: ({ signal }) => getUser(userId!, signal),
        enabled: !!userId,
    });

    const statusMutation = useMutation({
        mutationFn: (status: UserSettableStatus) => updateUserStatus(userId!, { status }),
        onSuccess: async (user) => {
            await queryClient.invalidateQueries({ queryKey: ['users'] });
            message.success(user.status === 'INACTIVE' ? t('notifications.deactivateSuccess') : t('notifications.activateSuccess'));
        },
        onError: (error) => {
            console.error('Failed to change user status:', error);
            message.error(t('notifications.statusError'));
        },
    });

    const resendMutation = useMutation({
        mutationFn: () => resendInvitation(userId!),
        onSuccess: () => {
            message.success(t('notifications.resendSuccess'));
        },
        onError: async (error) => {
            const code = getApiErrorCode(error);

            if (code === API_ERROR_CODE.CONFLICT) {
                // The user accepted the invitation meanwhile — refresh to show the new status.
                await queryClient.invalidateQueries({ queryKey: ['users'] });
                message.info(t('notifications.resendNotInvited'));
                return;
            }

            console.error('Failed to resend invitation:', error);
            message.error(code === API_ERROR_CODE.EMAIL_DELIVERY_FAILED
                ? t('notifications.emailDeliveryFailed')
                : t('notifications.resendError'));
        },
    });

    if (!userId || userQuery.isError) {
        return <QueryErrorState onRetry={userId ? () => void userQuery.refetch() : undefined} />;
    }

    if (!userQuery.data) {
        return <QueryLoadingState />;
    }

    const user = toUserDetails(userQuery.data);
    const canUpdate = can(RESOURCE_CODE.USER, PERMISSION_CODE.UPDATE);
    // The API refuses changing your own status (no admin lock-out).
    const isOwnAccount = session?.user.id === user.id;
    const nextStatus: UserSettableStatus = user.status === 'INACTIVE' ? 'ACTIVE' : 'INACTIVE';

    const statusButton = (
        <Popconfirm
            title={nextStatus === 'INACTIVE' ? t('confirm.deactivate') : t('confirm.activate')}
            okText={t('confirm.ok')}
            cancelText={t('confirm.cancel')}
            onConfirm={() => statusMutation.mutate(nextStatus)}
            disabled={isOwnAccount}
        >
            <Button danger={nextStatus === 'INACTIVE'} loading={statusMutation.isPending} disabled={isOwnAccount}>
                {nextStatus === 'INACTIVE' ? t('action.deactivate') : t('action.activate')}
            </Button>
        </Popconfirm>
    );

    return (
        <>
            <PageHeader
                title={formatFullName(user.firstName, user.lastName)}
                actions={canUpdate && (
                    <>
                        {user.status === 'INVITED' && (
                            <Button loading={resendMutation.isPending} onClick={() => resendMutation.mutate()}>
                                {t('action.resendInvitation')}
                            </Button>
                        )}
                        {isOwnAccount ? <Tooltip title={t('action.ownStatusLocked')}>{statusButton}</Tooltip> : statusButton}
                        <Button type="primary" onClick={() => void navigate(`/users/${user.id}/update`)}>
                            {t('action.edit')}
                        </Button>
                    </>
                )}
            />

            <Descriptions
                bordered
                column={1}
                items={[
                    { key: 'firstName', label: t('form.firstNameLabel'), children: user.firstName },
                    { key: 'lastName', label: t('form.lastNameLabel'), children: user.lastName || EMPTY_VALUE },
                    { key: 'email', label: t('form.emailLabel'), children: user.email },
                    { key: 'role', label: t('form.roleLabel'), children: user.role.name },
                    { key: 'status', label: t('table.statusColumn'), children: <UserStatusTag status={user.status} /> },
                    { key: 'createdAt', label: t('view.createdAtLabel'), children: formatDateTime(user.createdAt) },
                    { key: 'updatedAt', label: t('view.updatedAtLabel'), children: formatDateTime(user.updatedAt) },
                ]}
            />
        </>
    );
}
