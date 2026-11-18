import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Button, Table, type TableColumnsType, type TableProps } from 'antd';

import { ExecutionResultTag } from '../components/ExecutionResultTag';
import { TestCaseBulkActions } from '../components/TestCaseBulkActions';
import { TestCaseFilters, type TestCaseFilterValues } from '../components/TestCaseFilters';
import { TestCasePriorityTag } from '../components/TestCasePriorityTag';
import { TestCaseTagList } from '../components/TestCaseTagList';
import { getTestCases } from '../test-case.api';
import {
    TEST_CASE_DEFAULT_SORT,
    TEST_CASE_SORT_FIELDS,
    TEST_CASE_TABLE_WIDTH,
    TEST_CASE_VIRTUAL_BODY_HEIGHT,
    TEST_CASE_VIRTUAL_MIN_PAGE_SIZE,
} from '../test-case.constant';
import {
    applyTestCaseListParamChanges,
    hasTestCaseFilters,
    parseTestCaseListParams,
    TEST_CASE_LIST_PARAM,
    toTestCasePageRequestDto,
} from '../test-case.list-params';
import { toTestCasePage } from '../test-case.mapper';
import { testCaseListQueryKey } from '../test-case.query';
import type { TestCaseSortField, TestCaseSummaryType } from '../test-case.type';
import { useAuth } from '../../auth/auth.context';
import { PERMISSION_CODE, RESOURCE_CODE } from '../../auth/auth.constant';
import { useCurrentProject } from '../../project/current-project.context';
import { useTestSuiteOptions } from '../../test-suite/useTestSuiteOptions';
import { PageHeader } from '../../../shared/components/PageHeader';
import { QueryErrorState } from '../../../shared/components/QueryErrorState';
import { QueryLoadingState } from '../../../shared/components/QueryLoadingState';
import { PAGE_SIZE_OPTIONS } from '../../../shared/constant/page.constant';
import { formatDateTime } from '../../../shared/format/date.format';
import { fromTableSorter, toColumnSortOrder } from '../../../shared/list/list-sort';

const MAX_TAGS_IN_ROW = 3;

type TestCaseRow = TestCaseSummaryType & { suiteNames: string[] };

export function TestCasePaginationPage() {
    const { t } = useTranslation('testCase');
    const navigate = useNavigate();
    const { can } = useAuth();
    const project = useCurrentProject();

    const [searchParams, setSearchParams] = useSearchParams();
    const params = parseTestCaseListParams(searchParams);
    const request = toTestCasePageRequestDto(params);

    // Server-side search, filters, sort and paging; the previous page stays visible while the next loads.
    const testCaseQuery = useQuery({
        queryKey: testCaseListQueryKey(project.id, request),
        queryFn: ({ signal }) => getTestCases(project.id, request, signal),
        placeholderData: keepPreviousData,
        select: toTestCasePage,
    });

    const suiteOptionsQuery = useTestSuiteOptions(project.id);

    // Selected rows belong to the list they were picked from: another page, filter or sort clears them —
    // adjusted while rendering (React's documented alternative to an effect), so they don't come back when
    // the user returns to that page. The API takes at most 100 ids: one page at the largest page size.
    const listKey = JSON.stringify(request);
    const [selection, setSelection] = useState<{ listKey: string; ids: number[] }>({ listKey, ids: [] });

    if (selection.listKey !== listKey) {
        setSelection({ listKey, ids: [] });
    }

    const selectedIds = selection.listKey === listKey ? selection.ids : [];
    const clearSelection = () => setSelection({ listKey, ids: [] });

    // useMemo written explicitly (PRD Frontend Req §1: memoize the filtered/sorted test case list), although
    // the React Compiler would memoize it too. Rebuilt only when the page or the suites change, not on
    // every render (e.g. while typing in the search box).
    const rows = useMemo<TestCaseRow[]>(() => {
        const suiteNameById = new Map((suiteOptionsQuery.data ?? []).map((option) => [option.value, option.label]));

        return (testCaseQuery.data?.items ?? []).map((testCase) => ({
            ...testCase,
            // A suite beyond the first 100 options still gets a label.
            suiteNames: testCase.suiteIds.map((suiteId) => suiteNameById.get(suiteId) ?? `#${suiteId}`),
        }));
    }, [testCaseQuery.data, suiteOptionsQuery.data]);

    const handleFilterChange = (changes: Partial<TestCaseFilterValues>) => {
        setSearchParams((prev) => applyTestCaseListParamChanges(prev, changes));
    };

    const handleTableChange: TableProps<TestCaseRow>['onChange'] = (_pagination, _filters, sorter, extra) => {
        if (extra.action === 'sort') {
            const sort = fromTableSorter(sorter, TEST_CASE_SORT_FIELDS, TEST_CASE_DEFAULT_SORT);

            setSearchParams((prev) => applyTestCaseListParamChanges(prev, { sort }));
        }
    };

    if (testCaseQuery.isError) {
        return <QueryErrorState onRetry={() => void testCaseQuery.refetch()} />;
    }

    if (!testCaseQuery.data) {
        return <QueryLoadingState />;
    }

    const testCasePage = testCaseQuery.data;
    const canUpdate = can(RESOURCE_CODE.TEST_CASE, PERMISSION_CODE.UPDATE);
    // Rows can be selected by anyone who can act on several at once: change them (TEST_CASE UPDATE) or
    // assign them (TEST_ASSIGNMENT CREATE). The toolbar shows each action with its own permission.
    const canSelect = canUpdate || can(RESOURCE_CODE.TEST_ASSIGNMENT, PERMISSION_CODE.CREATE);
    const testCasesPath = `/projects/${project.id}/test-cases`;

    // Controlled sort: the column shows the URL's sort (title A→Z when it has none).
    const sortOrderOf = (field: TestCaseSortField) => toColumnSortOrder(params.sort, field);

    const columns: TableColumnsType<TestCaseRow> = [
        {
            title: t('table.titleColumn'),
            key: 'title',
            width: 320,
            sorter: true,
            sortOrder: sortOrderOf('title'),
            render: (_, testCase) => <Link to={`${testCasesPath}/${testCase.id}`}>{testCase.title}</Link>,
        },
        {
            title: t('table.priorityColumn'),
            key: 'priority',
            width: 120,
            sorter: true,
            sortOrder: sortOrderOf('priority'),
            render: (_, testCase) => <TestCasePriorityTag priority={testCase.priority} />,
        },
        {
            title: t('table.typeColumn'),
            key: 'type',
            width: 130,
            sorter: true,
            sortOrder: sortOrderOf('type'),
            render: (_, testCase) => t(`type.${testCase.type}`),
        },
        {
            title: t('table.tagsColumn'),
            key: 'tags',
            width: 200,
            render: (_, testCase) => <TestCaseTagList tags={testCase.tags} max={MAX_TAGS_IN_ROW} />,
        },
        {
            title: t('table.suitesColumn'),
            key: 'suites',
            width: 160,
            render: (_, testCase) => testCase.suiteNames.join(', '),
        },
        {
            title: t('table.lastResultColumn'),
            key: 'lastResult',
            width: 110,
            render: (_, testCase) => <ExecutionResultTag result={testCase.lastResult} />,
        },
        {
            title: t('table.lastExecutedColumn'),
            key: 'lastExecutedAt',
            width: 120,
            sorter: true,
            sortOrder: sortOrderOf('lastExecutedAt'),
            render: (_, testCase) => (testCase.lastExecutedAt ? formatDateTime(testCase.lastExecutedAt) : t('table.never')),
        },
        ...(canUpdate
            ? [{
                title: t('table.actionColumn'),
                key: 'action',
                width: 80,
                render: (_: unknown, testCase: TestCaseRow) => (
                    <Button type="link" onClick={() => void navigate(`${testCasesPath}/${testCase.id}/update`)}>
                        {t('action.edit')}
                    </Button>
                ),
            }]
            : []),
    ];

    // Large pages render only the rows in view (PRD Features §7: virtual scrolling for large lists).
    const isVirtual = params.pageSize >= TEST_CASE_VIRTUAL_MIN_PAGE_SIZE;

    return (
        <>
            <PageHeader
                title={t('page.paginationTitle')}
                actions={can(RESOURCE_CODE.TEST_CASE, PERMISSION_CODE.CREATE) && (
                    <Button type="primary" onClick={() => void navigate(`${testCasesPath}/create`)}>
                        {t('page.addTestCase')}
                    </Button>
                )}
            />

            <TestCaseFilters
                values={params}
                suiteOptions={suiteOptionsQuery.data ?? []}
                onChange={handleFilterChange}
            />

            {selectedIds.length > 0 && (
                <TestCaseBulkActions
                    projectId={project.id}
                    selectedIds={selectedIds}
                    suiteOptions={suiteOptionsQuery.data ?? []}
                    onClearSelection={clearSelection}
                />
            )}

            <Table<TestCaseRow>
                rowKey="id"
                rowSelection={canSelect
                    ? {
                        selectedRowKeys: selectedIds,
                        onChange: (keys) => setSelection({ listKey, ids: keys.map(Number) }),
                    }
                    : undefined}
                columns={columns}
                dataSource={rows}
                loading={testCaseQuery.isFetching}
                virtual={isVirtual}
                scroll={isVirtual ? { x: TEST_CASE_TABLE_WIDTH, y: TEST_CASE_VIRTUAL_BODY_HEIGHT } : { x: 'max-content' }}
                onChange={handleTableChange}
                locale={{ emptyText: hasTestCaseFilters(params) ? t('table.noMatches') : t('table.empty') }}
                pagination={{
                    current: testCasePage.page,
                    pageSize: testCasePage.pageSize,
                    total: testCasePage.totalItems,
                    showSizeChanger: true,
                    pageSizeOptions: PAGE_SIZE_OPTIONS,
                    showTotal: (total) => t('table.total', { count: total }),
                    onChange: (nextPage, nextPageSize) => {
                        setSearchParams((prev) => {
                            prev.set(TEST_CASE_LIST_PARAM.PAGE, String(nextPage));
                            prev.set(TEST_CASE_LIST_PARAM.PAGE_SIZE, String(nextPageSize));
                            return prev;
                        });
                    },
                }}
            />
        </>
    );
}
