import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router';
import { ArrowDownOutlined, ArrowUpOutlined, DeleteOutlined } from '@ant-design/icons';
import { App, Button, Descriptions, Flex, Popconfirm, Table, Tooltip, Typography, type TableColumnsType } from 'antd';

import { TestSuiteCasePicker } from '../components/TestSuiteCasePicker';
import { RunSuiteDialog } from '../../suite-run/components/RunSuiteDialog';
import { SuiteRunList } from '../../suite-run/components/SuiteRunList';
import { deleteTestSuite, getTestSuite, removeTestSuiteCase, reorderTestSuiteCases } from '../test-suite.api';
import { toTestSuiteDetails, withTestSuiteCaseOrder } from '../test-suite.mapper';
import { testSuiteDetailsQueryKey, testSuitesQueryKey } from '../test-suite.query';
import type { TestSuiteDetailsResponseDto } from '../test-suite.response.dto';
import type { TestSuiteCaseType } from '../test-suite.type';
import { useAuth } from '../../auth/auth.context';
import { PERMISSION_CODE, RESOURCE_CODE } from '../../auth/auth.constant';
import { useCurrentProject } from '../../project/current-project.context';
import { TestCasePriorityTag } from '../../test-case/components/TestCasePriorityTag';
import { testCasesQueryKey } from '../../test-case/test-case.query';
import { API_ERROR_CODE, getApiErrorCode } from '../../../app/api-error';
import { NotFoundState } from '../../../shared/components/NotFoundState';
import { PageHeader } from '../../../shared/components/PageHeader';
import { QueryErrorState } from '../../../shared/components/QueryErrorState';
import { QueryLoadingState } from '../../../shared/components/QueryLoadingState';
import { formatDateTime } from '../../../shared/format/date.format';
import { useNumericRouteParam } from '../../../shared/hooks/useNumericRouteParam';

const EMPTY_VALUE = '—';

export function TestSuiteViewPage() {
    const { t } = useTranslation('testSuite');
    const { t: tTestCase } = useTranslation('testCase');
    const { t: tSuiteRun } = useTranslation('suiteRun');
    const { t: tExecution } = useTranslation('testExecution');
    const navigate = useNavigate();
    const { message } = App.useApp();
    const queryClient = useQueryClient();
    const { session, can } = useAuth();
    const project = useCurrentProject();

    const { suiteId: suiteIdParam } = useParams();
    const { value: suiteId, isValid: isValidSuiteId } = useNumericRouteParam(suiteIdParam);
    const detailsKey = testSuiteDetailsQueryKey(project.id, suiteId);
    const listPath = `/projects/${project.id}/test-suites`;

    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const [isRunDialogOpen, setIsRunDialogOpen] = useState(false);

    const suiteQuery = useQuery({
        queryKey: detailsKey,
        queryFn: ({ signal }) => getTestSuite(project.id, suiteId!, signal),
        enabled: isValidSuiteId,
        select: toTestSuiteDetails,
    });

    // Suite counts and the test cases' suiteIds change with the suite's content.
    const refreshRelated = () => Promise.all([
        queryClient.invalidateQueries({ queryKey: testSuitesQueryKey(project.id) }),
        queryClient.invalidateQueries({ queryKey: testCasesQueryKey(project.id) }),
    ]);

    // Optimistic: the table shows the new order at once. Each move sends the full order (the API's
    // contract); moves share one mutation scope, so they reach the server one after another in click order.
    // When the last one settles, the suite is refetched — the server's order wins, also after a failure.
    const reorderMutationKey = ['test-suite-reorder', project.id, suiteId];
    const reorderMutation = useMutation({
        mutationKey: reorderMutationKey,
        scope: { id: `test-suite-reorder-${project.id}-${suiteId}` },
        mutationFn: (testCaseIds: number[]) => reorderTestSuiteCases(project.id, suiteId!, { testCaseIds }),
        onMutate: async (testCaseIds) => {
            await queryClient.cancelQueries({ queryKey: detailsKey });
            queryClient.setQueryData<TestSuiteDetailsResponseDto>(
                detailsKey,
                (suite) => suite && withTestSuiteCaseOrder(suite, testCaseIds),
            );
        },
        onError: (error) => {
            console.error('Failed to reorder the suite:', error);
            message.error(t('cases.reorderError'));
        },
        onSettled: async () => {
            if (queryClient.isMutating({ mutationKey: reorderMutationKey }) === 1) {
                await queryClient.invalidateQueries({ queryKey: detailsKey });
            }
        },
    });

    const removeMutation = useMutation({
        mutationFn: (testCaseId: number) => removeTestSuiteCase(project.id, suiteId!, testCaseId),
        onSuccess: () => message.success(t('cases.removed')),
        onError: (error) => {
            // Already removed by someone else: the refetch below shows the current content.
            if (getApiErrorCode(error) !== API_ERROR_CODE.NOT_FOUND) {
                console.error('Failed to remove the test case from the suite:', error);
                message.error(t('cases.removeError'));
            }
        },
        onSettled: () => Promise.all([queryClient.invalidateQueries({ queryKey: detailsKey }), refreshRelated()]),
    });

    const deleteMutation = useMutation({
        mutationFn: () => deleteTestSuite(project.id, suiteId!),
        onSuccess: async () => {
            // Leave first, so the deleted suite's own query doesn't refetch into a 404 on this page.
            void navigate(listPath);
            queryClient.removeQueries({ queryKey: detailsKey });
            await refreshRelated();
            message.success(t('notifications.deleteSuccess'));
        },
        onError: (error) => {
            if (getApiErrorCode(error) === API_ERROR_CODE.NOT_FOUND) {
                message.info(t('notifications.notFoundAnymore'));
                void refreshRelated();
                void navigate(listPath);
                return;
            }

            console.error('Failed to delete test suite:', error);
            message.error(t('notifications.deleteError'));
        },
    });

    if (!isValidSuiteId || getApiErrorCode(suiteQuery.error) === API_ERROR_CODE.NOT_FOUND) {
        return <NotFoundState />;
    }

    if (suiteQuery.isError) {
        return <QueryErrorState onRetry={() => void suiteQuery.refetch()} />;
    }

    if (!suiteQuery.data) {
        return <QueryLoadingState />;
    }

    const suite = suiteQuery.data;
    const canUpdate = can(RESOURCE_CODE.TEST_SUITE, PERMISSION_CODE.UPDATE);
    const caseIds = suite.testCases.map((testCase) => testCase.id);

    // Run suite: shown disabled with the reason to a role that can't execute (ui-requirements §2 rule 3), and
    // for an empty suite (the API answers 409).
    const canRun = can(RESOURCE_CODE.TEST_EXECUTION, PERMISSION_CODE.CREATE);
    const runDisabledReason = !canRun
        ? tExecution('form.readOnly', { role: session?.role.name })
        : suite.testCases.length === 0 ? tSuiteRun('run.emptySuite') : undefined;

    const moveCase = (index: number, offset: -1 | 1) => {
        const ids = [...caseIds];
        [ids[index], ids[index + offset]] = [ids[index + offset], ids[index]];
        reorderMutation.mutate(ids);
    };

    const caseColumns: TableColumnsType<TestSuiteCaseType> = [
        { title: t('view.orderColumn'), dataIndex: 'order', key: 'order', width: 56 },
        {
            title: t('view.titleColumn'),
            key: 'title',
            render: (_, testCase) => <Link to={`/projects/${project.id}/test-cases/${testCase.id}`}>{testCase.title}</Link>,
        },
        {
            title: t('view.priorityColumn'),
            key: 'priority',
            render: (_, testCase) => <TestCasePriorityTag priority={testCase.priority} />,
        },
        { title: t('view.typeColumn'), key: 'type', render: (_, testCase) => tTestCase(`type.${testCase.type}`) },
        ...(canUpdate
            ? [{
                title: t('view.actionColumn'),
                key: 'action',
                render: (_: unknown, testCase: TestSuiteCaseType, index: number) => (
                    <Flex gap={4}>
                        <Tooltip title={t('cases.moveUp', { title: testCase.title })}>
                            <Button
                                type="text"
                                size="small"
                                icon={<ArrowUpOutlined />}
                                aria-label={t('cases.moveUp', { title: testCase.title })}
                                disabled={index === 0}
                                onClick={() => moveCase(index, -1)}
                            />
                        </Tooltip>
                        <Tooltip title={t('cases.moveDown', { title: testCase.title })}>
                            <Button
                                type="text"
                                size="small"
                                icon={<ArrowDownOutlined />}
                                aria-label={t('cases.moveDown', { title: testCase.title })}
                                disabled={index === caseIds.length - 1}
                                onClick={() => moveCase(index, 1)}
                            />
                        </Tooltip>
                        <Popconfirm
                            title={t('cases.removeTitle')}
                            description={t('cases.removeDescription')}
                            okText={t('cases.remove')}
                            okButtonProps={{ danger: true }}
                            cancelText={t('action.cancel')}
                            onConfirm={() => removeMutation.mutate(testCase.id)}
                        >
                            <Button
                                type="text"
                                size="small"
                                danger
                                icon={<DeleteOutlined />}
                                aria-label={t('cases.removeLabel', { title: testCase.title })}
                            />
                        </Popconfirm>
                    </Flex>
                ),
            }]
            : []),
    ];

    return (
        <>
            <PageHeader
                title={suite.name}
                actions={(
                    <>
                        {can(RESOURCE_CODE.TEST_EXECUTION, PERMISSION_CODE.READ) && (
                            <Tooltip title={runDisabledReason}>
                                <Button type="primary" disabled={!!runDisabledReason} onClick={() => setIsRunDialogOpen(true)}>
                                    {tSuiteRun('run.button')}
                                </Button>
                            </Tooltip>
                        )}
                        {canUpdate && (
                            <Button onClick={() => void navigate(`${listPath}/${suite.id}/update`)}>
                                {t('action.edit')}
                            </Button>
                        )}
                        {can(RESOURCE_CODE.TEST_SUITE, PERMISSION_CODE.DELETE) && (
                            <Popconfirm
                                title={t('action.deleteTitle')}
                                description={t('action.deleteDescription')}
                                okText={t('action.delete')}
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
                        { key: 'description', label: t('view.descriptionLabel'), span: 'filled', children: suite.description || EMPTY_VALUE },
                        { key: 'testCaseCount', label: t('view.testCaseCountLabel'), span: 'filled', children: suite.testCases.length },
                        { key: 'createdAt', label: t('view.createdAtLabel'), children: formatDateTime(suite.createdAt) },
                        { key: 'updatedAt', label: t('view.updatedAtLabel'), children: formatDateTime(suite.updatedAt) },
                    ]}
                />

                <section aria-labelledby="test-suite-cases-title">
                    <Flex justify="space-between" align="center" wrap gap="small">
                        <Typography.Title level={4} id="test-suite-cases-title">
                            {t('view.casesTitle', { count: suite.testCases.length })}
                        </Typography.Title>
                        {canUpdate && (
                            <Button onClick={() => setIsPickerOpen(true)}>{t('cases.add')}</Button>
                        )}
                    </Flex>
                    <Table<TestSuiteCaseType>
                        rowKey="id"
                        size="small"
                        columns={caseColumns}
                        dataSource={suite.testCases}
                        pagination={false}
                        scroll={{ x: 'max-content' }}
                        locale={{ emptyText: t('view.casesEmpty') }}
                    />
                </section>

                {can(RESOURCE_CODE.TEST_EXECUTION, PERMISSION_CODE.READ) && (
                    <section aria-labelledby="test-suite-runs-title">
                        <Typography.Title level={4} id="test-suite-runs-title">{tSuiteRun('list.title')}</Typography.Title>
                        <SuiteRunList projectId={project.id} suiteId={suite.id} />
                    </section>
                )}
            </Flex>

            {isRunDialogOpen && (
                <RunSuiteDialog
                    suite={{ id: suite.id, name: suite.name, testCaseCount: suite.testCases.length }}
                    onClose={() => setIsRunDialogOpen(false)}
                />
            )}

            {isPickerOpen && (
                <TestSuiteCasePicker projectId={project.id} suite={suite} onClose={() => setIsPickerOpen(false)} />
            )}
        </>
    );
}
