import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { Button, Descriptions, Flex, Table, Typography, type TableColumnsType } from 'antd';

import { ProjectStatusTag } from '../components/ProjectStatusTag';
import { useCurrentProject } from '../current-project.context';
import type { ProjectMemberType } from '../project.type';
import { UserStatusTag } from '../../user/components/UserStatusTag';
import { formatFullName } from '../../../shared/format/name.format';
import { useAuth } from '../../auth/auth.context';
import { PERMISSION_CODE, RESOURCE_CODE } from '../../auth/auth.constant';
import { PageHeader } from '../../../shared/components/PageHeader';
import { formatDateTime } from '../../../shared/format/date.format';

const EMPTY_VALUE = '—';

export function ProjectViewPage() {
    const { t } = useTranslation('project');
    const navigate = useNavigate();
    const { can } = useAuth();

    // Loaded (or answered with the not-found page) by ProjectWorkspaceLayout.
    const project = useCurrentProject();

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
