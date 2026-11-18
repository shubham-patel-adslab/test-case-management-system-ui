import { useTranslation } from 'react-i18next';
import { Select } from 'antd';

import styles from './AnalyticsProjectFilter.module.scss';
import { useProjectOptions } from '../../project/useProjectOptions';

const ALL_PROJECTS = 'all';

type ProjectFilterValue = number | typeof ALL_PROJECTS;

type AnalyticsProjectFilterProps = {
    // null = every project the user may read.
    projectId: number | null;
    onChange: (projectId: number | null) => void;
};

// All projects (the default), or one of the user's projects — the API's only filter besides the days.
export function AnalyticsProjectFilter({ projectId, onChange }: AnalyticsProjectFilterProps) {
    const { t } = useTranslation('analytics');
    const { options, isPending, isError } = useProjectOptions(projectId);

    const allOptions = [{ value: ALL_PROJECTS, label: t('project.all') }, ...options];
    // A project it can't name (outside the user's scope) shows the placeholder, not its raw id.
    const value = projectId === null ? ALL_PROJECTS : options.find((option) => option.value === projectId)?.value;

    return (
        <Select<ProjectFilterValue>
            className={styles['tb-analytics-project-filter']}
            aria-label={t('project.label')}
            placeholder={isError ? t('project.loadError') : t('project.placeholder')}
            status={isError ? 'error' : undefined}
            loading={isPending}
            showSearch={{ optionFilterProp: 'label' }}
            options={allOptions}
            value={value}
            onChange={(next) => onChange(next === ALL_PROJECTS ? null : next)}
            notFoundContent={t('project.notFound')}
        />
    );
}
