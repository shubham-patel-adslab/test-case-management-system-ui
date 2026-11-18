import { lazy, Suspense } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router';
import { App, Button, Collapse, Descriptions, Flex, Popconfirm, Table, Tooltip, Typography, type TableColumnsType } from 'antd';

import styles from './TestCaseViewPage.module.scss';
import { ExecutionResultTag } from '../components/ExecutionResultTag';
import { TestCasePriorityTag } from '../components/TestCasePriorityTag';
import { TestCaseTagList } from '../components/TestCaseTagList';
import { deleteTestCase, getTestCase } from '../test-case.api';
import { toTestCaseDetails } from '../test-case.mapper';
import { testCaseDetailsQueryKey, testCasesQueryKey } from '../test-case.query';
import type { TestStepType } from '../test-case.type';
import { useAuth } from '../../auth/auth.context';
import { PERMISSION_CODE, RESOURCE_CODE } from '../../auth/auth.constant';
import { useCurrentProject } from '../../project/current-project.context';
import { testSuitesQueryKey } from '../../test-suite/test-suite.query';
import { useTestSuiteOptions } from '../../test-suite/useTestSuiteOptions';
import { API_ERROR_CODE, getApiErrorCode } from '../../../app/api-error';
import { NotFoundState } from '../../../shared/components/NotFoundState';
import { PageHeader } from '../../../shared/components/PageHeader';
import { QueryErrorState } from '../../../shared/components/QueryErrorState';
import { QueryLoadingState } from '../../../shared/components/QueryLoadingState';
import { formatDateTime } from '../../../shared/format/date.format';
import { useNumericRouteParam } from '../../../shared/hooks/useNumericRouteParam';

const EMPTY_VALUE = '—';

// PRD Frontend Req §2: lazy load test execution history — its code loads, and it fetches, only once its
// section is opened.
const TestCaseExecutionHistory = lazy(() => import('../../test-execution/components/TestCaseExecutionHistory'));

export function TestCaseViewPage() {
    const { t } = useTranslation('testCase');
    const { t: tExecution } = useTranslation('testExecution');
    const navigate = useNavigate();
    const { message } = App.useApp();
    const queryClient = useQueryClient();
    const { session, can } = useAuth();
    const project = useCurrentProject();

    const { testCaseId: testCaseIdParam } = useParams();
    const { value: testCaseId, isValid: isValidTestCaseId } = useNumericRouteParam(testCaseIdParam);
    const listPath = `/projects/${project.id}/test-cases`;

    const testCaseQuery = useQuery({
        queryKey: testCaseDetailsQueryKey(project.id, testCaseId),
        queryFn: ({ signal }) => getTestCase(project.id, testCaseId!, signal),
        enabled: isValidTestCaseId,
        select: toTestCaseDetails,
    });

    const suiteOptionsQuery = useTestSuiteOptions(project.id);

    const deleteMutation = useMutation({
        mutationFn: () => deleteTestCase(project.id, testCaseId!),
        onSuccess: async () => {
            // Leave first, so the deleted test case's own query doesn't refetch into a 404 on this page.
            void navigate(listPath);
            queryClient.removeQueries({ queryKey: testCaseDetailsQueryKey(project.id, testCaseId) });
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: testCasesQueryKey(project.id) }),
                queryClient.invalidateQueries({ queryKey: testSuitesQueryKey(project.id) }),
            ]);
            message.success(t('notifications.deleteSuccess'));
        },
        onError: (error) => {
            // Already gone (deleted by someone else): the list is where the user wanted to end up anyway.
            if (getApiErrorCode(error) === API_ERROR_CODE.NOT_FOUND) {
                message.info(t('notifications.notFoundAnymore'));
                void queryClient.invalidateQueries({ queryKey: testCasesQueryKey(project.id) });
                void navigate(listPath);
                return;
            }

            console.error('Failed to delete test case:', error);
            message.error(t('notifications.deleteError'));
        },
    });

    if (!isValidTestCaseId || getApiErrorCode(testCaseQuery.error) === API_ERROR_CODE.NOT_FOUND) {
        return <NotFoundState />;
    }

    if (testCaseQuery.isError) {
        return <QueryErrorState onRetry={() => void testCaseQuery.refetch()} />;
    }

    if (!testCaseQuery.data) {
        return <QueryLoadingState />;
    }

    const testCase = testCaseQuery.data;
    const canExecute = can(RESOURCE_CODE.TEST_EXECUTION, PERMISSION_CODE.CREATE);
    const suiteNameById = new Map((suiteOptionsQuery.data ?? []).map((option) => [option.value, option.label]));

    // Multi-line text as typed (line breaks kept); never rendered as HTML.
    const longText = (text: string) => (text
        ? <Typography.Paragraph className={styles['tb-test-case-view__text']}>{text}</Typography.Paragraph>
        : EMPTY_VALUE);

    const stepColumns: TableColumnsType<TestStepType> = [
        { title: t('view.stepOrderColumn'), dataIndex: 'order', key: 'order', width: 56 },
        {
            title: t('view.stepActionColumn'),
            key: 'action',
            render: (_, step) => <span className={styles['tb-test-case-view__text']}>{step.action}</span>,
        },
        {
            title: t('view.stepExpectedResultColumn'),
            key: 'expectedResult',
            render: (_, step) => <span className={styles['tb-test-case-view__text']}>{step.expectedResult}</span>,
        },
    ];

    return (
        <>
            <PageHeader
                title={testCase.title}
                actions={(
                    <>
                        {/* Shown disabled with the reason to a role that can't execute (ui-requirements §2 rule 3). */}
                        {can(RESOURCE_CODE.TEST_EXECUTION, PERMISSION_CODE.READ) && (
                            <Tooltip title={canExecute ? undefined : tExecution('form.readOnly', { role: session?.role.name })}>
                                <Button
                                    disabled={!canExecute}
                                    onClick={() => void navigate(`${listPath}/${testCase.id}/execute`)}
                                >
                                    {t('action.execute')}
                                </Button>
                            </Tooltip>
                        )}
                        {can(RESOURCE_CODE.TEST_CASE, PERMISSION_CODE.UPDATE) && (
                            <Button type="primary" onClick={() => void navigate(`${listPath}/${testCase.id}/update`)}>
                                {t('action.edit')}
                            </Button>
                        )}
                        {can(RESOURCE_CODE.TEST_CASE, PERMISSION_CODE.DELETE) && (
                            <Popconfirm
                                title={t('action.deleteTitle')}
                                description={t('action.deleteDescription')}
                                okText={t('action.deleteConfirm')}
                                okButtonProps={{ danger: true }}
                                cancelText={t('action.cancel')}
                                onConfirm={() => deleteMutation.mutate()}
                            >
                                <Button danger loading={deleteMutation.isPending}>{t('action.delete')}</Button>
                            </Popconfirm>
                        )}
                    </>
                )}
            />

            <Flex vertical gap="large">
                <Descriptions
                    bordered
                    column={{ xs: 1, md: 2 }}
                    items={[
                        { key: 'priority', label: t('view.priorityLabel'), children: <TestCasePriorityTag priority={testCase.priority} /> },
                        { key: 'type', label: t('view.typeLabel'), children: t(`type.${testCase.type}`) },
                        { key: 'lastResult', label: t('view.lastResultLabel'), children: <ExecutionResultTag result={testCase.lastResult} /> },
                        {
                            key: 'lastExecutedAt',
                            label: t('view.lastExecutedLabel'),
                            children: testCase.lastExecutedAt ? formatDateTime(testCase.lastExecutedAt) : t('table.never'),
                        },
                        {
                            key: 'tags',
                            label: t('view.tagsLabel'),
                            span: 'filled',
                            children: testCase.tags.length > 0 ? <TestCaseTagList tags={testCase.tags} /> : EMPTY_VALUE,
                        },
                        {
                            key: 'suites',
                            label: t('view.suitesLabel'),
                            span: 'filled',
                            children: testCase.suiteIds.length > 0
                                ? testCase.suiteIds.map((suiteId) => suiteNameById.get(suiteId) ?? `#${suiteId}`).join(', ')
                                : EMPTY_VALUE,
                        },
                        { key: 'description', label: t('view.descriptionLabel'), span: 'filled', children: longText(testCase.description) },
                        { key: 'preConditions', label: t('view.preConditionsLabel'), span: 'filled', children: longText(testCase.preConditions) },
                        { key: 'postConditions', label: t('view.postConditionsLabel'), span: 'filled', children: longText(testCase.postConditions) },
                        { key: 'createdAt', label: t('view.createdAtLabel'), children: formatDateTime(testCase.createdAt) },
                        { key: 'updatedAt', label: t('view.updatedAtLabel'), children: formatDateTime(testCase.updatedAt) },
                    ]}
                />

                <section aria-labelledby="test-case-steps-title">
                    <Typography.Title level={4} id="test-case-steps-title">
                        {t('view.stepsTitle', { count: testCase.steps.length })}
                    </Typography.Title>
                    <Table<TestStepType>
                        rowKey="id"
                        size="small"
                        columns={stepColumns}
                        dataSource={testCase.steps}
                        pagination={false}
                        scroll={{ x: 'max-content' }}
                    />
                </section>

                {can(RESOURCE_CODE.TEST_EXECUTION, PERMISSION_CODE.READ) && (
                    // antd renders a panel's content only when it's first opened.
                    <Collapse
                        items={[{
                            key: 'history',
                            label: tExecution('history.title'),
                            children: (
                                <Suspense fallback={<QueryLoadingState />}>
                                    <TestCaseExecutionHistory projectId={project.id} testCaseId={testCase.id} />
                                </Suspense>
                            ),
                        }]}
                    />
                )}
            </Flex>
        </>
    );
}
