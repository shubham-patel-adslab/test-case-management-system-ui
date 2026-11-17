import { useTranslation } from 'react-i18next';
import { Tag } from 'antd';

import type { UserStatus } from '../user.type';

// antd preset tag colors — named theme presets, not raw color values.
const STATUS_COLOR: Record<UserStatus, string> = {
    INVITED: 'gold',
    ACTIVE: 'green',
    INACTIVE: 'default',
};

type UserStatusTagProps = {
    status: UserStatus;
};

export function UserStatusTag({ status }: UserStatusTagProps) {
    const { t } = useTranslation('user');

    return <Tag color={STATUS_COLOR[status]}>{t(`status.${status}`)}</Tag>;
}
