import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Button, Flex, Table, Typography, type TableColumnsType } from 'antd';

import { ProjectStatusTag } from '../components/ProjectStatusTag';
import { getProjects } from '../project.api';
import { toProjectPage } from '../project.mapper';
import type { ProjectDetailsType } from '../project.type';
import { QueryErrorState } from '../../../shared/components/QueryErrorState';
import { QueryLoadingState } from '../../../shared/components/QueryLoadingState';
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '../../../shared/constant/page.constant';

export function ProjectPaginationPage() {
    const { t } = useTranslation('project');
    const navigate = useNavigate();

    const [searchParams, setSearchParams] = useSearchParams();

    const page = Number(searchParams.get('page')) || DEFAULT_PAGE;
    const pageSize = Number(searchParams.get('pageSize')) || DEFAULT_PAGE_SIZE;

    const projectQuery = useQuery({
        queryKey: ['projects', 'list', { page, pageSize }],
        queryFn: ({ signal }) => getProjects({ page, pageSize }, signal),
        placeholderData: keepPreviousData,
    });

    if (projectQuery.isError) {
        return <QueryErrorState onRetry={() => void projectQuery.refetch()} />;
    }

    if (!projectQuery.data) {
        return <QueryLoadingState />;
    }

    const projectPage = toProjectPage(projectQuery.data);

    const columns: TableColumnsType<ProjectDetailsType> = [
        {
            title: t('table.nameColumn'),
            key: 'name',
            render: (_, project) => <Link to={`/projects/${project.id}`}>{project.name}</Link>,
        },
        {
            title: t('table.versionColumn'),
            dataIndex: 'version',
            key: 'version',
        },
        {
            title: t('table.statusColumn'),
            key: 'status',
            render: (_, project) => <ProjectStatusTag status={project.status} />,
        },
        {
            title: t('table.membersColumn'),
            key: 'members',
            render: (_, project) => project.members.length,
        },
        {
            title: t('table.actionColumn'),
            key: 'action',
            render: (_, project) => (
                <Flex gap="small">
                    <Button type="link" onClick={() => void navigate(`/projects/${project.id}`)}>
                        {t('action.view')}
                    </Button>
                    <Button type="link" onClick={() => void navigate(`/projects/${project.id}/update`)}>
                        {t('action.edit')}
                    </Button>
                </Flex>
            ),
        },
    ];

    return (
        <>
            <Flex justify="space-between" align="center">
                <Typography.Title level={3}>{t('page.paginationTitle')}</Typography.Title>
                <Button type="primary" onClick={() => void navigate('/projects/create')}>
                    {t('page.addProject')}
                </Button>
            </Flex>

            <Table<ProjectDetailsType>
                rowKey="id"
                columns={columns}
                dataSource={projectPage.items}
                loading={projectQuery.isFetching}
                scroll={{ x: 'max-content' }}
                pagination={{
                    current: projectPage.page,
                    pageSize: projectPage.pageSize,
                    total: projectPage.totalItems,
                    showSizeChanger: true,
                    pageSizeOptions: PAGE_SIZE_OPTIONS,
                    onChange: (nextPage, nextPageSize) => {
                        setSearchParams((prev) => {
                            prev.set('page', String(nextPage));
                            prev.set('pageSize', String(nextPageSize));
                            return prev;
                        });
                    },
                }}
            />
        </>
    );
}
