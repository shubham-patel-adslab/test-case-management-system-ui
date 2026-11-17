import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { App, Button, Dropdown, type MenuProps } from 'antd';

import { useAuth } from '../auth.context';
import { formatFullName } from '../../../shared/format/name.format';

export function UserMenu() {
    const { t } = useTranslation('auth');
    const { message } = App.useApp();
    const { session, signOut } = useAuth();

    // On failure the cookie may still be set, so the session is kept rather than pretending to be signed out.
    const signOutMutation = useMutation({
        mutationFn: signOut,
        onError: (error) => {
            console.error('Sign-out failed:', error);
            void message.error(t('notifications.signOutError'));
        },
    });

    if (!session) {
        return null;
    }

    // The account line is information, not an action: a group title (plain text, no hover, not focusable),
    // not a disabled item, which would look and read as an unavailable action.
    const items: MenuProps['items'] = [
        {
            type: 'group',
            key: 'account',
            label: `${session.user.email} · ${session.role.name}`,
            children: [
                {
                    key: 'sign-out',
                    icon: <LogoutOutlined />,
                    label: t('userMenu.signOut'),
                    disabled: signOutMutation.isPending,
                    onClick: () => signOutMutation.mutate(),
                },
            ],
        },
    ];

    return (
        <Dropdown menu={{ items }} trigger={['click']}>
            <Button type="text" icon={<UserOutlined />} aria-label={t('userMenu.label')}>
                {formatFullName(session.user.firstName, session.user.lastName)}
            </Button>
        </Dropdown>
    );
}
