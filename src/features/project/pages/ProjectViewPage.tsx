import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { Button, Descriptions, Flex, Table, Typography, type TableColumnsType } from 'antd';

import { ProjectStatusTag } from '../components/ProjectStatusTag';
import { getProject } from '../project.api';
import { toProjectDetails } from '../project.mapper';
import type { ProjectMemberType } from '../project.type';
import { UserStatusTag } from '../../user/components/UserStatusTag';
import { API_ERROR_CODE, getApiErrorCode } from '../../../app/api-error';
import { NotFoundState } from '../../../shared/components/NotFoundState';
import { formatFullName } from '../../../shared/format/name.format';
import { useAuth } from '../../auth/auth.context';
import { PERMISSION_CODE, RESOURCE_CODE } from '../../auth/auth.constant';
import { PageHeader } from '../../../shared/components/PageHeader';
import { QueryErrorState } from '../../../shared/components/QueryErrorState';
import { QueryLoadingState } from '../../../shared/components/QueryLoadingState';
import { useNumericRouteParam } from '../../../shared/hooks/useNumericRouteParam';
import { formatDateTime } from '../../../shared/format/date.format';

const EMPTY_VALUE = '—';

export function ProjectViewPage() {
    const { t } = useTranslation('project');
    const navigate = useNavigate();
    const { can } = useAuth();

    const { projectId } = useParams();

    const { value: projectID, isValid: isParamValid } = useNumericRouteParam(projectId);
    const isValidProjectID = projectID !== undefined && isParamValid;

    const projectQuery = useQuery({
        queryKey: ['projects', 'detail', projectID],
        queryFn: ({ signal }) => getProject(projectID!, signal),
        enabled: isValidProjectID,
    });

    // Not found, or not one of the user's projects — the API answers 404 for both.
    if (getApiErrorCode(projectQuery.error) === API_ERROR_CODE.NOT_FOUND) {
        return <NotFoundState />;
    }

    if (!isValidProjectID || projectQuery.isError) {
        return (
            <QueryErrorState onRetry={isValidProjectID ? () => void projectQuery.refetch() : undefined} />
        );
    }

    if (!projectQuery.data) {
        return <QueryLoadingState />;
    }

    const project = toProjectDetails(projectQuery.data);

    const memberColumns: TableColumnsType<ProjectMemberType> = [
        {
            title: t('members.nameColumn'),
            key: 'name',
            render: (_, member) => formatFullName(member.firstName, member.lastName),
        },
        { title: t('members.emailColumn'), dataIndex: 'email', key: 'email' },
        { title: t('members.roleColumn'), key: 'role', render: (_, member) => member.role.name },
        { title: t('members.statusColumn'), key: 'status', render: (_, member) => <UserStatusTag status={member.status} /> },
    ];

    return (
        <>
            <PageHeader
                title={project.name}
                actions={can(RESOURCE_CODE.PROJECT, PERMISSION_CODE.UPDATE) && (
                    <Button type="primary" onClick={() => void navigate(`/projects/${project.id}/update`)}>
                        {t('action.edit')}
                    </Button>
                )}
            />

            <Flex vertical gap="large">
                <Descriptions
                    bordered
                    column={1}
                    items={[
                        { key: 'name', label: t('form.nameLabel'), children: project.name },
                        { key: 'version', label: t('form.versionLabel'), children: project.version || EMPTY_VALUE },
                        { key: 'status', label: t('form.statusLabel'), children: <ProjectStatusTag status={project.status} /> },
                        { key: 'description', label: t('form.descriptionLabel'), children: project.description || EMPTY_VALUE },
                        { key: 'createdAt', label: t('view.createdAtLabel'), children: formatDateTime(project.createdAt) },
                        { key: 'updatedAt', label: t('view.updatedAtLabel'), children: formatDateTime(project.updatedAt) },
                    ]}
                />

                <section aria-labelledby="project-members-title">
                    <Typography.Title level={4} id="project-members-title">
                        {t('members.title', { count: project.members.length })}
                    </Typography.Title>
                    <Table<ProjectMemberType>
                        rowKey="id"
                        size="small"
                        columns={memberColumns}
                        dataSource={project.members}
                        pagination={false}
                        scroll={{ x: 'max-content' }}
                        locale={{ emptyText: t('members.empty') }}
                    />
                </section>
            </Flex>
        </>
    );
}
