import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Button, Flex, Table, type TableColumnsType, type TableProps } from 'antd';

import { ProjectStatusTag } from '../components/ProjectStatusTag';
import { getProjects } from '../project.api';
import { PROJECT_DEFAULT_SORT, PROJECT_SORT_FIELDS } from '../project.constant';
import { toProjectPage } from '../project.mapper';
import type { ProjectDetailsType } from '../project.type';
import { useAuth } from '../../auth/auth.context';
import { PERMISSION_CODE, RESOURCE_CODE } from '../../auth/auth.constant';
import { PageHeader } from '../../../shared/components/PageHeader';
import { QueryErrorState } from '../../../shared/components/QueryErrorState';
import { QueryLoadingState } from '../../../shared/components/QueryLoadingState';
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '../../../shared/constant/page.constant';
import { SORT_PARAM } from '../../../shared/constant/sort.constant';
import { fromTableSorter, parseListSort, setListSortParam, toColumnSortOrder, toSortParam } from '../../../shared/list/list-sort';

export function ProjectPaginationPage() {
    const { t } = useTranslation('project');
    const navigate = useNavigate();
    const { can } = useAuth();

    const [searchParams, setSearchParams] = useSearchParams();

    const page = Number(searchParams.get('page')) || DEFAULT_PAGE;
    const pageSize = Number(searchParams.get('pageSize')) || DEFAULT_PAGE_SIZE;
    // Server-side order, in the URL; name A→Z (the API default) unless the user picks another.
    const sort = parseListSort(searchParams.get(SORT_PARAM), PROJECT_SORT_FIELDS, PROJECT_DEFAULT_SORT);
    const request = { page, pageSize, sort: toSortParam(sort, PROJECT_DEFAULT_SORT) };

    const projectQuery = useQuery({
        queryKey: ['projects', 'list', request],
        queryFn: ({ signal }) => getProjects(request, signal),
        placeholderData: keepPreviousData,
    });

    const handleTableChange: TableProps<ProjectDetailsType>['onChange'] = (_pagination, _filters, sorter, extra) => {
        if (extra.action === 'sort') {
            setSearchParams((prev) => setListSortParam(prev, fromTableSorter(sorter, PROJECT_SORT_FIELDS, PROJECT_DEFAULT_SORT), PROJECT_DEFAULT_SORT));
        }
    };

    if (projectQuery.isError) {
        return <QueryErrorState onRetry={() => void projectQuery.refetch()} />;
    }

    if (!projectQuery.data) {
        return <QueryLoadingState />;
    }

    const projectPage = toProjectPage(projectQuery.data);
    const canUpdate = can(RESOURCE_CODE.PROJECT, PERMISSION_CODE.UPDATE);

    const columns: TableColumnsType<ProjectDetailsType> = [
        {
            title: t('table.nameColumn'),
            key: 'name',
            sorter: true,
            sortOrder: toColumnSortOrder(sort, 'name'),
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
                    {canUpdate && (
                        <Button type="link" onClick={() => void navigate(`/projects/${project.id}/update`)}>
                            {t('action.edit')}
                        </Button>
                    )}
                </Flex>
            ),
        },
    ];

    return (
        <>
            <PageHeader
                title={t('page.paginationTitle')}
                actions={can(RESOURCE_CODE.PROJECT, PERMISSION_CODE.CREATE) && (
                    <Button type="primary" onClick={() => void navigate('/projects/create')}>
                        {t('page.addProject')}
                    </Button>
                )}
            />

            <Table<ProjectDetailsType>
                rowKey="id"
                columns={columns}
                dataSource={projectPage.items}
                loading={projectQuery.isFetching}
                scroll={{ x: 'max-content' }}
                onChange={handleTableChange}
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
