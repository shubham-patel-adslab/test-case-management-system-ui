import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router';
import { Select } from 'antd';

import styles from './ProjectSwitcher.module.scss';
import { useCurrentProjectContext } from '../current-project.context';
import { getProjects } from '../project.api';
import { PROJECT_SWITCHER_PAGE_SIZE } from '../project.constant';
import type { ProjectPageResponseDto } from '../project.response.dto';

type ProjectOption = { value: number; label: string };

function toProjectOptions(page: ProjectPageResponseDto): ProjectOption[] {
    return page.items.map((project) => ({ value: project.id, label: project.name }));
}

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
    const { projectId, projectQuery } = useCurrentProjectContext();

    // The API has no project search, so this is its largest page, by name (the API's default order); the
    // list page shows all.
    const request = { page: 1, pageSize: PROJECT_SWITCHER_PAGE_SIZE };
    const projectsQuery = useQuery({
        queryKey: ['projects', 'list', request],
        queryFn: ({ signal }) => getProjects(request, signal),
        select: toProjectOptions,
    });

    const options = projectsQuery.data ?? [];
    const currentProject = projectQuery?.data;

    // An older project outside that page still shows its name, not its id.
    const isCurrentListed = options.some((option) => option.value === currentProject?.id);
    const shownOptions = currentProject && !isCurrentListed
        ? [{ value: currentProject.id, label: currentProject.name }, ...options]
        : options;

    return (
        <Select<number>
            className={styles['tb-project-switcher']}
            aria-label={t('switcher.label')}
            placeholder={projectsQuery.isError ? t('switcher.loadError') : t('switcher.placeholder')}
            status={projectsQuery.isError ? 'error' : undefined}
            loading={projectsQuery.isPending}
            showSearch={{ optionFilterProp: 'label' }}
            options={shownOptions}
            // Only a project it can name: a missing one (the not-found page) would show its raw id.
            value={shownOptions.some((option) => option.value === projectId) ? projectId : undefined}
            onChange={(id) => void navigate(toSwitchedProjectPath(pathname, id, sectionTargets))}
            notFoundContent={t('switcher.notFound')}
        />
    );
}
