import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Flex, Table, Tabs, type TableColumnsType, type TableProps } from 'antd';

import { ExecutionProgressSummary } from '../components/ExecutionProgressSummary';
import { DefectReferenceTag } from '../../defect/components/DefectReferenceTag';
import { ExecutionStatusTag } from '../components/ExecutionStatusTag';
import { UserReferenceName } from '../components/UserReferenceName';
import { getTestExecutionProgress, getTestExecutions } from '../test-execution.api';
import { EXECUTION_PENDING, EXECUTION_QUEUE_TAB, TEST_EXECUTION_DEFAULT_SORT, TEST_EXECUTION_SORT_FIELDS } from '../test-execution.constant';
import { toExecutionProgress, toTestExecutionPage } from '../test-execution.mapper';
import { testExecutionListQueryKey, testExecutionProgressQueryKey } from '../test-execution.query';
import type { TestExecutionPageRequestDto } from '../test-execution.request.dto';
import type { ExecutionQueueTab, TestExecutionSummaryType } from '../test-execution.type';
import { useAuth } from '../../auth/auth.context';
import { PERMISSION_CODE, RESOURCE_CODE } from '../../auth/auth.constant';
import { useCurrentProject } from '../../project/current-project.context';
import { EXECUTION_RESULTS } from '../../test-case/test-case.constant';
import { PageHeader } from '../../../shared/components/PageHeader';
import { QueryErrorState } from '../../../shared/components/QueryErrorState';
import { QueryLoadingState } from '../../../shared/components/QueryLoadingState';
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '../../../shared/constant/page.constant';
import { SORT_PARAM } from '../../../shared/constant/sort.constant';
import { fromTableSorter, parseListSort, setListSortParam, toColumnSortOrder, toSortParam } from '../../../shared/list/list-sort';
import { formatDateTime } from '../../../shared/format/date.format';

const EMPTY_VALUE = '—';
const TAB_PARAM = 'tab';

function isQueueTab(value: string | null): value is ExecutionQueueTab {
    return Object.values(EXECUTION_QUEUE_TAB).some((tab) => tab === value);
}

// Each tab is one filter of the project's executions (ui-requirements §4.4).
function toTabFilter(tab: ExecutionQueueTab, userId: string): Pick<TestExecutionPageRequestDto, 'status' | 'assigneeId'> {
    switch (tab) {
        case EXECUTION_QUEUE_TAB.MINE:
            return { status: EXECUTION_PENDING, assigneeId: userId };
        case EXECUTION_QUEUE_TAB.PENDING:
            return { status: EXECUTION_PENDING };
        case EXECUTION_QUEUE_TAB.COMPLETED:
            return { status: EXECUTION_RESULTS.join(',') };
    }
}

export function ExecutionQueuePage() {
    const { t } = useTranslation('testExecution');
    const { session, can } = useAuth();
    const project = useCurrentProject();
    const userId = session!.user.id;

    const [searchParams, setSearchParams] = useSearchParams();
    const tabParam = searchParams.get(TAB_PARAM);
    // Someone who can't execute has nothing "assigned to me": they start on all pending.
    const defaultTab = can(RESOURCE_CODE.TEST_EXECUTION, PERMISSION_CODE.UPDATE) ? EXECUTION_QUEUE_TAB.MINE : EXECUTION_QUEUE_TAB.PENDING;
    const tab = isQueueTab(tabParam) ? tabParam : defaultTab;
    const page = Number(searchParams.get('page')) || DEFAULT_PAGE;
    const pageSize = Number(searchParams.get('pageSize')) || DEFAULT_PAGE_SIZE;
    // Server-side order, in the URL; test case title A→Z (the API default) unless the user picks another.
    const sort = parseListSort(searchParams.get(SORT_PARAM), TEST_EXECUTION_SORT_FIELDS, TEST_EXECUTION_DEFAULT_SORT);
    const request: TestExecutionPageRequestDto = {
        page,
        pageSize,
        ...toTabFilter(tab, userId),
        sort: toSortParam(sort, TEST_EXECUTION_DEFAULT_SORT),
    };

    const executionQuery = useQuery({
        queryKey: testExecutionListQueryKey(project.id, request),
        queryFn: ({ signal }) => getTestExecutions(project.id, request, signal),
        placeholderData: keepPreviousData,
        select: toTestExecutionPage,
    });

    // "Assigned to me" shows my progress; the other tabs the project's.
    const progressAssigneeId = tab === EXECUTION_QUEUE_TAB.MINE ? userId : undefined;
    const progressQuery = useQuery({
        queryKey: testExecutionProgressQueryKey(project.id, progressAssigneeId),
        queryFn: ({ signal }) => getTestExecutionProgress(project.id, progressAssigneeId, signal),
        select: toExecutionProgress,
    });

    const handleTableChange: TableProps<TestExecutionSummaryType>['onChange'] = (_pagination, _filters, sorter, extra) => {
        if (extra.action === 'sort') {
            setSearchParams((prev) => setListSortParam(
                prev,
                fromTableSorter(sorter, TEST_EXECUTION_SORT_FIELDS, TEST_EXECUTION_DEFAULT_SORT),
                TEST_EXECUTION_DEFAULT_SORT,
            ));
        }
    };

    // Another tab starts at page 1 and keeps the chosen order.
    const handleTabChange = (nextTab: string) => {
        setSearchParams((prev) => {
            const next = new URLSearchParams({ [TAB_PARAM]: nextTab });
            const sortParam = prev.get(SORT_PARAM);

            if (sortParam) {
                next.set(SORT_PARAM, sortParam);
            }

            return next;
        });
    };

    if (executionQuery.isError) {
        return <QueryErrorState onRetry={() => void executionQuery.refetch()} />;
    }

    if (!executionQuery.data) {
        return <QueryLoadingState />;
    }

    const executionPage = executionQuery.data;
    const executionsPath = `/projects/${project.id}/executions`;

    const columns: TableColumnsType<TestExecutionSummaryType> = [
        {
            title: t('table.testCaseColumn'),
            key: 'testCaseTitle',
            sorter: true,
            sortOrder: toColumnSortOrder(sort, 'testCaseTitle'),
            render: (_, execution) => <Link to={`${executionsPath}/${execution.id}`}>{execution.testCaseTitle}</Link>,
        },
        { title: t('table.statusColumn'), key: 'status', render: (_, execution) => <ExecutionStatusTag status={execution.status} /> },
        {
            title: t('table.assigneeColumn'),
            key: 'assignee',
            render: (_, execution) => <UserReferenceName user={execution.assignee} fallback={t('table.unassigned')} />,
        },
        { title: t('table.executedByColumn'), key: 'executedBy', render: (_, execution) => <UserReferenceName user={execution.executedBy} /> },
        {
            title: t('table.executedAtColumn'),
            key: 'executedAt',
            sorter: true,
            sortOrder: toColumnSortOrder(sort, 'executedAt'),
            render: (_, execution) => (execution.executedAt ? formatDateTime(execution.executedAt) : EMPTY_VALUE),
        },
        {
            title: t('table.createdAtColumn'),
            key: 'createdAt',
            sorter: true,
            sortOrder: toColumnSortOrder(sort, 'createdAt'),
            render: (_, execution) => formatDateTime(execution.createdAt),
        },
        {
            title: t('table.defectColumn'),
            key: 'defect',
            render: (_, execution) => (execution.defect ? <DefectReferenceTag defect={execution.defect} /> : EMPTY_VALUE),
        },
    ];

    const emptyText = {
        [EXECUTION_QUEUE_TAB.MINE]: t('table.emptyMine'),
        [EXECUTION_QUEUE_TAB.PENDING]: t('table.emptyPending'),
        [EXECUTION_QUEUE_TAB.COMPLETED]: t('table.emptyCompleted'),
    }[tab];

    return (
        <>
            <PageHeader title={t('page.queueTitle')} />

            <Flex vertical gap="middle">
                {progressQuery.data && (
                    <ExecutionProgressSummary
                        title={tab === EXECUTION_QUEUE_TAB.MINE ? t('progress.titleMine') : t('progress.title')}
                        progress={progressQuery.data}
                    />
                )}

                <div>
                    <Tabs
                        activeKey={tab}
                        onChange={handleTabChange}
                        items={Object.values(EXECUTION_QUEUE_TAB).map((key) => ({ key, label: t(`tab.${key}`) }))}
                    />
                    <Table<TestExecutionSummaryType>
                        rowKey="id"
                        columns={columns}
                        dataSource={executionPage.items}
                        loading={executionQuery.isFetching}
                        scroll={{ x: 'max-content' }}
                        onChange={handleTableChange}
                        locale={{ emptyText }}
                        pagination={{
                            current: executionPage.page,
                            pageSize: executionPage.pageSize,
                            total: executionPage.totalItems,
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
                </div>
            </Flex>
        </>
    );
}
