import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Button, Table, Typography, type TableColumnsType, type TableProps } from 'antd';

import styles from './TestSuitePaginationPage.module.scss';
import { getTestSuites } from '../test-suite.api';
import { TEST_SUITE_DEFAULT_SORT, TEST_SUITE_SORT_FIELDS } from '../test-suite.constant';
import { toTestSuitePage } from '../test-suite.mapper';
import { testSuiteListQueryKey } from '../test-suite.query';
import type { TestSuiteSummaryType } from '../test-suite.type';
import { useAuth } from '../../auth/auth.context';
import { PERMISSION_CODE, RESOURCE_CODE } from '../../auth/auth.constant';
import { useCurrentProject } from '../../project/current-project.context';
import { PageHeader } from '../../../shared/components/PageHeader';
import { QueryErrorState } from '../../../shared/components/QueryErrorState';
import { QueryLoadingState } from '../../../shared/components/QueryLoadingState';
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '../../../shared/constant/page.constant';
import { SORT_PARAM } from '../../../shared/constant/sort.constant';
import { fromTableSorter, parseListSort, setListSortParam, toColumnSortOrder, toSortParam } from '../../../shared/list/list-sort';

const DESCRIPTION_LINES = 2;

export function TestSuitePaginationPage() {
    const { t } = useTranslation('testSuite');
    const navigate = useNavigate();
    const { can } = useAuth();
    const project = useCurrentProject();

    const [searchParams, setSearchParams] = useSearchParams();
    const page = Number(searchParams.get('page')) || DEFAULT_PAGE;
    const pageSize = Number(searchParams.get('pageSize')) || DEFAULT_PAGE_SIZE;
    // Server-side order, in the URL; name A→Z (the API default) unless the user picks another.
    const sort = parseListSort(searchParams.get(SORT_PARAM), TEST_SUITE_SORT_FIELDS, TEST_SUITE_DEFAULT_SORT);
    const request = { page, pageSize, sort: toSortParam(sort, TEST_SUITE_DEFAULT_SORT) };

    const suiteQuery = useQuery({
        queryKey: testSuiteListQueryKey(project.id, request),
        queryFn: ({ signal }) => getTestSuites(project.id, request, signal),
        placeholderData: keepPreviousData,
        select: toTestSuitePage,
    });

    if (suiteQuery.isError) {
        return <QueryErrorState onRetry={() => void suiteQuery.refetch()} />;
    }

    if (!suiteQuery.data) {
        return <QueryLoadingState />;
    }

    const suitePage = suiteQuery.data;
    const suitesPath = `/projects/${project.id}/test-suites`;
    const canUpdate = can(RESOURCE_CODE.TEST_SUITE, PERMISSION_CODE.UPDATE);

    const handleTableChange: TableProps<TestSuiteSummaryType>['onChange'] = (_pagination, _filters, sorter, extra) => {
        if (extra.action === 'sort') {
            setSearchParams((prev) => setListSortParam(
                prev,
                fromTableSorter(sorter, TEST_SUITE_SORT_FIELDS, TEST_SUITE_DEFAULT_SORT),
                TEST_SUITE_DEFAULT_SORT,
            ));
        }
    };

    const columns: TableColumnsType<TestSuiteSummaryType> = [
        {
            title: t('table.nameColumn'),
            key: 'name',
            sorter: true,
            sortOrder: toColumnSortOrder(sort, 'name'),
            render: (_, suite) => <Link to={`${suitesPath}/${suite.id}`}>{suite.name}</Link>,
        },
        {
            title: t('table.descriptionColumn'),
            key: 'description',
            render: (_, suite) => (
                <Typography.Paragraph ellipsis={{ rows: DESCRIPTION_LINES }} className={styles['tb-test-suite-list__description']}>
                    {suite.description}
                </Typography.Paragraph>
            ),
        },
        { title: t('table.testCaseCountColumn'), dataIndex: 'testCaseCount', key: 'testCaseCount', align: 'right' },
        ...(canUpdate
            ? [{
                title: t('table.actionColumn'),
                key: 'action',
                render: (_: unknown, suite: TestSuiteSummaryType) => (
                    <Button type="link" onClick={() => void navigate(`${suitesPath}/${suite.id}/update`)}>
                        {t('action.edit')}
                    </Button>
                ),
            }]
            : []),
    ];

    return (
        <>
            <PageHeader
                title={t('page.paginationTitle')}
                actions={can(RESOURCE_CODE.TEST_SUITE, PERMISSION_CODE.CREATE) && (
                    <Button type="primary" onClick={() => void navigate(`${suitesPath}/create`)}>
                        {t('page.addTestSuite')}
                    </Button>
                )}
            />

            <Table<TestSuiteSummaryType>
                rowKey="id"
                columns={columns}
                dataSource={suitePage.items}
                loading={suiteQuery.isFetching}
                scroll={{ x: 'max-content' }}
                onChange={handleTableChange}
                locale={{ emptyText: t('table.empty') }}
                pagination={{
                    current: suitePage.page,
                    pageSize: suitePage.pageSize,
                    total: suitePage.totalItems,
                    showSizeChanger: true,
                    pageSizeOptions: PAGE_SIZE_OPTIONS,
                    showTotal: (total) => t('table.total', { count: total }),
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
