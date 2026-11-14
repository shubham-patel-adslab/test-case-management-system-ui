import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { Button, Descriptions, Flex, Typography } from 'antd';

import { ProjectStatusTag } from '../components/ProjectStatusTag';
import { getProject } from '../project.api';
import { toProjectDetails } from '../project.mapper';
import { QueryErrorState } from '../../../shared/components/QueryErrorState';
import { QueryLoadingState } from '../../../shared/components/QueryLoadingState';
import { useNumericRouteParam } from '../../../shared/hooks/useNumericRouteParam';

const EMPTY_VALUE = '—';

function formatDateTime(isoDate: string): string {
    return new Date(isoDate).toLocaleString();
}

export function ProjectViewPage() {
    const { t } = useTranslation('project');
    const navigate = useNavigate();

    const { projectId } = useParams();

    const { value: projectID, isValid: isParamValid } = useNumericRouteParam(projectId);
    const isValidProjectID = projectID !== undefined && isParamValid;

    const projectQuery = useQuery({
        queryKey: ['projects', 'detail', projectID],
        queryFn: ({ signal }) => getProject(projectID!, signal),
        enabled: isValidProjectID,
    });

    if (!isValidProjectID || projectQuery.isError) {
        return (
            <QueryErrorState onRetry={isValidProjectID ? () => void projectQuery.refetch() : undefined} />
        );
    }

    if (!projectQuery.data) {
        return <QueryLoadingState />;
    }

    const project = toProjectDetails(projectQuery.data);
    const memberNames = project.members.map((member) => member.name).join(', ');

    return (
        <>
            <Flex justify="space-between" align="center">
                <Typography.Title level={3}>{project.name}</Typography.Title>
                <Button type="primary" onClick={() => void navigate(`/projects/${project.id}/update`)}>
                    {t('action.edit')}
                </Button>
            </Flex>

            <Descriptions
                bordered
                column={1}
                items={[
                    { key: 'name', label: t('form.nameLabel'), children: project.name },
                    { key: 'version', label: t('form.versionLabel'), children: project.version || EMPTY_VALUE },
                    { key: 'status', label: t('form.statusLabel'), children: <ProjectStatusTag status={project.status} /> },
                    { key: 'description', label: t('form.descriptionLabel'), children: project.description || EMPTY_VALUE },
                    { key: 'members', label: t('view.membersLabel'), children: memberNames || EMPTY_VALUE },
                    { key: 'createdAt', label: t('view.createdAtLabel'), children: formatDateTime(project.createdAt) },
                    { key: 'updatedAt', label: t('view.updatedAtLabel'), children: formatDateTime(project.updatedAt) },
                ]}
            />
        </>
    );
}
