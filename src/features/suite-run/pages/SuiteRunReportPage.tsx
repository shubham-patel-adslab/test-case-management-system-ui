import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router';
import { Button, Card, Col, Descriptions, Flex, Row, Table, Typography, type TableColumnsType } from 'antd';

import { SuiteRunStatusPie } from '../components/SuiteRunStatusPie';
import { getSuiteRun } from '../suite-run.api';
import { toSuiteRunDetails } from '../suite-run.mapper';
import { suiteRunDetailsQueryKey } from '../suite-run.query';
import { useCurrentProject } from '../../project/current-project.context';
import { DefectReferenceTag } from '../../defect/components/DefectReferenceTag';
import { ExecutionProgressSummary } from '../../test-execution/components/ExecutionProgressSummary';
import { ExecutionStatusTag } from '../../test-execution/components/ExecutionStatusTag';
import { UserReferenceName } from '../../test-execution/components/UserReferenceName';
import type { TestExecutionSummaryType } from '../../test-execution/test-execution.type';
import { API_ERROR_CODE, getApiErrorCode } from '../../../app/api-error';
import { NotFoundState } from '../../../shared/components/NotFoundState';
import { PageHeader } from '../../../shared/components/PageHeader';
import { QueryErrorState } from '../../../shared/components/QueryErrorState';
import { QueryLoadingState } from '../../../shared/components/QueryLoadingState';
import { formatDate, formatDateTime } from '../../../shared/format/date.format';
import { useNumericRouteParam } from '../../../shared/hooks/useNumericRouteParam';

const EMPTY_VALUE = '—';

// The suite report (PRD Features §6: suite-level reporting): one run's progress, status distribution and
// executions in suite order. Still available after the suite is deleted (it keeps the suite's name).
export function SuiteRunReportPage() {
    const { t } = useTranslation('suiteRun');
    const navigate = useNavigate();
    const project = useCurrentProject();

    const { runId: runIdParam } = useParams();
    const { value: runId, isValid: isValidRunId } = useNumericRouteParam(runIdParam);

    const runQuery = useQuery({
        queryKey: suiteRunDetailsQueryKey(project.id, runId),
        queryFn: ({ signal }) => getSuiteRun(project.id, runId!, signal),
        enabled: isValidRunId,
        select: toSuiteRunDetails,
    });

    if (!isValidRunId || getApiErrorCode(runQuery.error) === API_ERROR_CODE.NOT_FOUND) {
        return <NotFoundState />;
    }

    if (runQuery.isError) {
        return <QueryErrorState onRetry={() => void runQuery.refetch()} />;
    }

    if (!runQuery.data) {
        return <QueryLoadingState />;
    }

    const run = runQuery.data;

    const columns: TableColumnsType<TestExecutionSummaryType> = [
        { title: t('report.orderColumn'), key: 'order', width: 56, render: (_, __, index) => index + 1 },
        {
            title: t('report.testCaseColumn'),
            key: 'testCase',
            render: (_, execution) => <Link to={`/projects/${project.id}/executions/${execution.id}`}>{execution.testCaseTitle}</Link>,
        },
        { title: t('report.statusColumn'), key: 'status', render: (_, execution) => <ExecutionStatusTag status={execution.status} /> },
        { title: t('report.assigneeColumn'), key: 'assignee', render: (_, execution) => <UserReferenceName user={execution.assignee} /> },
        { title: t('report.executedByColumn'), key: 'executedBy', render: (_, execution) => <UserReferenceName user={execution.executedBy} /> },
        {
            title: t('report.executedAtColumn'),
            key: 'executedAt',
            render: (_, execution) => (execution.executedAt ? formatDateTime(execution.executedAt) : EMPTY_VALUE),
        },
        {
            title: t('report.defectColumn'),
            key: 'defect',
            render: (_, execution) => (execution.defect ? <DefectReferenceTag defect={execution.defect} /> : EMPTY_VALUE),
        },
    ];

    return (
        <>
            <PageHeader
                title={t('report.title', { suite: run.suiteName, date: formatDate(run.createdAt) })}
                actions={run.suiteId !== null && (
                    <Button onClick={() => void navigate(`/projects/${project.id}/test-suites/${run.suiteId}`)}>{t('report.openSuite')}</Button>
                )}
            />

            <Flex vertical gap="large">
                <Descriptions
                    bordered
                    column={{ xs: 1, md: 2 }}
                    items={[
                        { key: 'createdBy', label: t('report.createdByLabel'), children: <UserReferenceName user={run.createdBy} /> },
                        { key: 'createdAt', label: t('report.createdAtLabel'), children: formatDateTime(run.createdAt) },
                    ]}
                />
                {run.suiteId === null && <Typography.Text type="secondary">{t('report.suiteDeleted')}</Typography.Text>}

                <Row gutter={[16, 16]}>
                    <Col xs={24} lg={12}>
                        <ExecutionProgressSummary title={t('list.progressColumn')} progress={run.progress} />
                    </Col>
                    <Col xs={24} lg={12}>
                        <Card size="small" title={t('report.chartTitle')}>
                            <SuiteRunStatusPie progress={run.progress} />
                        </Card>
                    </Col>
                </Row>

                <section aria-labelledby="suite-run-executions-title">
                    <Typography.Title level={4} id="suite-run-executions-title">
                        {t('report.executionsTitle', { count: run.executions.length })}
                    </Typography.Title>
                    <Table<TestExecutionSummaryType>
                        rowKey="id"
                        size="small"
                        columns={columns}
                        dataSource={run.executions}
                        pagination={false}
                        scroll={{ x: 'max-content' }}
                    />
                </section>
            </Flex>
        </>
    );
}
