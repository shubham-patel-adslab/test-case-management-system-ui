import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Progress, Table, type TableColumnsType } from 'antd';

import { getSuiteRuns } from '../suite-run.api';
import { SUITE_RUN_LIST_PAGE_SIZE } from '../suite-run.constant';
import { toSuiteRunPage } from '../suite-run.mapper';
import { suiteRunListQueryKey } from '../suite-run.query';
import type { SuiteRunSummaryType } from '../suite-run.type';
import { UserReferenceName } from '../../test-execution/components/UserReferenceName';
import { QueryErrorState } from '../../../shared/components/QueryErrorState';
import { QueryLoadingState } from '../../../shared/components/QueryLoadingState';
import { formatDateTime } from '../../../shared/format/date.format';

const PERCENT = 100;
const PROGRESS_WIDTH = 140;
const RESULT_KEYS = ['passed', 'failed', 'blocked', 'skipped'] as const;

type SuiteRunListProps = {
    projectId: number;
    suiteId: number;
};

// A suite's runs, newest first, with each run's progress (PRD Features §6: suite-level reporting).
export function SuiteRunList({ projectId, suiteId }: SuiteRunListProps) {
    const { t } = useTranslation('suiteRun');
    // Paging is local: a section of the suite page, not a page of its own.
    const [page, setPage] = useState(1);
    const request = { page, pageSize: SUITE_RUN_LIST_PAGE_SIZE };

    const runsQuery = useQuery({
        queryKey: suiteRunListQueryKey(projectId, suiteId, request),
        queryFn: ({ signal }) => getSuiteRuns(projectId, suiteId, request, signal),
        placeholderData: keepPreviousData,
        select: toSuiteRunPage,
    });

    if (runsQuery.isError) {
        return <QueryErrorState onRetry={() => void runsQuery.refetch()} />;
    }

    if (!runsQuery.data) {
        return <QueryLoadingState />;
    }

    const columns: TableColumnsType<SuiteRunSummaryType> = [
        { title: t('list.createdAtColumn'), key: 'createdAt', render: (_, run) => formatDateTime(run.createdAt) },
        { title: t('list.createdByColumn'), key: 'createdBy', render: (_, run) => <UserReferenceName user={run.createdBy} /> },
        {
            title: t('list.progressColumn'),
            key: 'progress',
            render: (_, { progress }) => {
                const executed = progress.total - progress.pending;

                return (
                    <Progress
                        size={[PROGRESS_WIDTH, 8]}
                        percent={progress.total > 0 ? Math.round((executed / progress.total) * PERCENT) : 0}
                        format={() => t('list.executed', { executed, total: progress.total })}
                    />
                );
            },
        },
        {
            title: t('list.resultsColumn'),
            key: 'results',
            render: (_, { progress }) => RESULT_KEYS.map((key) => `${t(`status.${key}`)} ${progress[key]}`).join(' · '),
        },
        {
            title: '',
            key: 'report',
            render: (_, run) => <Link to={`/projects/${projectId}/suite-runs/${run.id}`}>{t('list.report')}</Link>,
        },
    ];

    return (
        <Table<SuiteRunSummaryType>
            rowKey="id"
            size="small"
            columns={columns}
            dataSource={runsQuery.data.items}
            loading={runsQuery.isFetching}
            scroll={{ x: 'max-content' }}
            locale={{ emptyText: t('list.empty') }}
            pagination={{
                current: runsQuery.data.page,
                pageSize: runsQuery.data.pageSize,
                total: runsQuery.data.totalItems,
                hideOnSinglePage: true,
                onChange: setPage,
            }}
        />
    );
}
