import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Table, type TableColumnsType } from 'antd';

import { ExecutionStatusTag } from './ExecutionStatusTag';
import { DefectReferenceTag } from '../../defect/components/DefectReferenceTag';
import { UserReferenceName } from './UserReferenceName';
import { getTestExecutions } from '../test-execution.api';
import { EXECUTION_HISTORY_PAGE_SIZE, TEST_EXECUTION_HISTORY_SORT } from '../test-execution.constant';
import type { TestExecutionPageRequestDto } from '../test-execution.request.dto';
import { toTestExecutionPage } from '../test-execution.mapper';
import { testExecutionListQueryKey } from '../test-execution.query';
import type { TestExecutionSummaryType } from '../test-execution.type';
import { QueryErrorState } from '../../../shared/components/QueryErrorState';
import { QueryLoadingState } from '../../../shared/components/QueryLoadingState';
import { formatDateTime } from '../../../shared/format/date.format';

const EMPTY_VALUE = '—';

type TestCaseExecutionHistoryProps = {
    projectId: number;
    testCaseId: number;
};

// A test case's runs, newest first (PRD Features §4: execution history) — the execution list filtered by
// test case. The test case page loads this lazily, only once its section is opened. Default export for
// React.lazy.
export default function TestCaseExecutionHistory({ projectId, testCaseId }: TestCaseExecutionHistoryProps) {
    const { t } = useTranslation('testExecution');
    // Paging is local: the history is a section of the test case page, not a page of its own.
    const [page, setPage] = useState(1);
    // Every row has the same title, so the API's title order would be no order: newest first instead.
    const request: TestExecutionPageRequestDto = { page, pageSize: EXECUTION_HISTORY_PAGE_SIZE, testCaseId, sort: TEST_EXECUTION_HISTORY_SORT };

    const historyQuery = useQuery({
        queryKey: testExecutionListQueryKey(projectId, request),
        queryFn: ({ signal }) => getTestExecutions(projectId, request, signal),
        placeholderData: keepPreviousData,
        select: toTestExecutionPage,
    });

    if (historyQuery.isError) {
        return <QueryErrorState onRetry={() => void historyQuery.refetch()} />;
    }

    if (!historyQuery.data) {
        return <QueryLoadingState />;
    }

    const columns: TableColumnsType<TestExecutionSummaryType> = [
        { title: t('table.statusColumn'), key: 'status', render: (_, execution) => <ExecutionStatusTag status={execution.status} /> },
        { title: t('table.assigneeColumn'), key: 'assignee', render: (_, execution) => <UserReferenceName user={execution.assignee} fallback={t('table.unassigned')} /> },
        { title: t('table.executedByColumn'), key: 'executedBy', render: (_, execution) => <UserReferenceName user={execution.executedBy} /> },
        {
            title: t('table.executedAtColumn'),
            key: 'executedAt',
            render: (_, execution) => (execution.executedAt ? formatDateTime(execution.executedAt) : EMPTY_VALUE),
        },
        {
            title: t('table.defectColumn'),
            key: 'defect',
            render: (_, execution) => (execution.defect ? <DefectReferenceTag defect={execution.defect} /> : EMPTY_VALUE),
        },
        {
            title: '',
            key: 'view',
            render: (_, execution) => <Link to={`/projects/${projectId}/executions/${execution.id}`}>{t('history.view')}</Link>,
        },
    ];

    return (
        <Table<TestExecutionSummaryType>
            rowKey="id"
            size="small"
            columns={columns}
            dataSource={historyQuery.data.items}
            loading={historyQuery.isFetching}
            scroll={{ x: 'max-content' }}
            locale={{ emptyText: t('history.empty') }}
            pagination={{
                current: historyQuery.data.page,
                pageSize: historyQuery.data.pageSize,
                total: historyQuery.data.totalItems,
                hideOnSinglePage: true,
                onChange: setPage,
            }}
        />
    );
}
