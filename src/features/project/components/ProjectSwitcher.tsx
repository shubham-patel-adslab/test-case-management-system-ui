import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router';
import { Select } from 'antd';

import styles from './ProjectSwitcher.module.scss';
import { useCurrentProjectContext } from '../current-project.context';
import { useProjectOptions } from '../useProjectOptions';

// Where switching to another project leads: the section's list when the user is in one (test cases, or a
// suite run report → test suites), else the project's page. Never an item of the old project — its ids mean
// nothing there.
function toSwitchedProjectPath(pathname: string, projectId: number, sectionTargets: ReadonlyMap<string, string>): string {
    const target = sectionTargets.get(pathname.split('/')[3] ?? '');

    return target ? `/projects/${projectId}/${target}` : `/projects/${projectId}`;
}

type ProjectSwitcherProps = {
    // Path segment below /projects/:projectId → the section to open in the other project (supplied by the
    // app shell).
    sectionTargets: ReadonlyMap<string, string>;
};

// Header control that changes the current project. The URL holds it, so switching is navigation.
export function ProjectSwitcher({ sectionTargets }: ProjectSwitcherProps) {
    const { t } = useTranslation('project');
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const { projectId } = useCurrentProjectContext();
    // The first projects by name; the list page shows all.
    const { options, isPending, isError } = useProjectOptions(projectId);

    return (
        <Select<number>
            className={styles['tb-project-switcher']}
            aria-label={t('switcher.label')}
            placeholder={isError ? t('switcher.loadError') : t('switcher.placeholder')}
            status={isError ? 'error' : undefined}
            loading={isPending}
            showSearch={{ optionFilterProp: 'label' }}
            options={options}
            // Only a project it can name: a missing one (the not-found page) would show its raw id.
            value={options.some((option) => option.value === projectId) ? projectId : undefined}
            onChange={(id) => void navigate(toSwitchedProjectPath(pathname, id, sectionTargets))}
            notFoundContent={t('switcher.notFound')}
        />
    );
}
