import { useTranslation } from 'react-i18next';
import { Tag } from 'antd';

import type { ProjectStatus } from '../project.type';

// antd preset tag colors — named theme presets, not raw color values.
const STATUS_COLOR: Record<ProjectStatus, string> = {
    ACTIVE: 'green',
    ON_HOLD: 'orange',
    COMPLETED: 'blue',
    ARCHIVED: 'default',
};

type ProjectStatusTagProps = {
    status: ProjectStatus;
};

export function ProjectStatusTag({ status }: ProjectStatusTagProps) {
    const { t } = useTranslation('project');

    return <Tag color={STATUS_COLOR[status]}>{t(`status.${status}`)}</Tag>;
}
