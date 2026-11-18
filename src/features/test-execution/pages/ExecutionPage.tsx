import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router';
import { App, Button, Descriptions, Flex, Table, Tooltip, Typography, type TableColumnsType } from 'antd';

import styles from './ExecutionPage.module.scss';
import { ExecutionAuditTrail } from '../components/ExecutionAuditTrail';
import { ExecutionResultForm } from '../components/ExecutionResultForm';
import { ExecutionStatusTag } from '../components/ExecutionStatusTag';
import { UserReferenceName } from '../components/UserReferenceName';
import { getTestExecution, recordTestExecutionResult } from '../test-execution.api';
import { EXECUTION_PENDING } from '../test-execution.constant';
import { toTestExecutionDetails, toTestExecutionResultRequestDto } from '../test-execution.mapper';
import { testExecutionAuditQueryKey, testExecutionDetailsQueryKey, testExecutionsQueryKey } from '../test-execution.query';
import type { ExecutionResultFormType, TestExecutionStepType } from '../test-execution.type';
import { AttachmentTable } from '../../attachment/components/AttachmentTable';
import { AttachmentUploader } from '../../attachment/components/AttachmentUploader';
import { CreateDefectDialog } from '../../defect/components/CreateDefectDialog';
import { DefectCard } from '../../defect/components/DefectCard';
import { useAuth } from '../../auth/auth.context';
import { PERMISSION_CODE, RESOURCE_CODE } from '../../auth/auth.constant';
import { useCurrentProject } from '../../project/current-project.context';
import { suiteRunsQueryKey } from '../../suite-run/suite-run.query';
import { ExecutionResultTag } from '../../test-case/components/ExecutionResultTag';
import { getTestCase } from '../../test-case/test-case.api';
import { testCaseDetailsQueryKey, testCasesQueryKey } from '../../test-case/test-case.query';
import { API_ERROR_CODE, getApiErrorCode } from '../../../app/api-error';
import { FORM_EXIT_NAVIGATION } from '../../../shared/components/form/FormActions';
import { NotFoundState } from '../../../shared/components/NotFoundState';
import { PageHeader } from '../../../shared/components/PageHeader';
import { QueryErrorState } from '../../../shared/components/QueryErrorState';
import { QueryLoadingState } from '../../../shared/components/QueryLoadingState';
import { formatDateTime } from '../../../shared/format/date.format';
import { useNumericRouteParam } from '../../../shared/hooks/useNumericRouteParam';

const EMPTY_VALUE = '—';

// A pending run: record its result. A recorded run: what happened, its defect, attachments and audit trail.
export function ExecutionPage() {
    const { t } = useTranslation('testExecution');
    const { t: tTestCase } = useTranslation('testCase');
    const navigate = useNavigate();
    const { message } = App.useApp();
    const queryClient = useQueryClient();
    const { session, can } = useAuth();
    const project = useCurrentProject();

    const { executionId: executionIdParam } = useParams();
    const { value: executionId, isValid: isValidExecutionId } = useNumericRouteParam(executionIdParam);
    const detailsKey = testExecutionDetailsQueryKey(project.id, executionId);
    const queuePath = `/projects/${project.id}/executions`;
    const { t: tDefect } = useTranslation('defect');
    const { t: tAttachment } = useTranslation('attachment');
    const [isDefectDialogOpen, setIsDefectDialogOpen] = useState(false);

    const executionQuery = useQuery({
        queryKey: detailsKey,
        queryFn: ({ signal }) => getTestExecution(project.id, executionId!, signal),
        enabled: isValidExecutionId,
        select: toTestExecutionDetails,
    });

    const execution = executionQuery.data;
    const isPending = execution?.status === EXECUTION_PENDING;
    const testCaseId = execution?.testCaseId ?? null;

    // Pre/post-conditions aren't part of a run's own copy: read them from the test case (current version)
    // while the run is still to be done.
    const testCaseQuery = useQuery({
        queryKey: testCaseDetailsQueryKey(project.id, testCaseId ?? undefined),
        queryFn: ({ signal }) => getTestCase(project.id, testCaseId!, signal),
        enabled: isPending && testCaseId !== null,
    });

    const recordMutation = useMutation({
        mutationFn: (form: ExecutionResultFormType) => recordTestExecutionResult(project.id, executionId!, toTestExecutionResultRequestDto(form)),
        onSuccess: async (details) => {
            queryClient.setQueryData(detailsKey, details);
            // Queue, progress, histories, the test case's last result, and its suite run's progress.
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: testExecutionsQueryKey(project.id) }),
                queryClient.invalidateQueries({ queryKey: testCasesQueryKey(project.id) }),
                queryClient.invalidateQueries({ queryKey: suiteRunsQueryKey(project.id) }),
            ]);
            message.success(t('notifications.recordSuccess', { result: tTestCase(`result.${details.status}`) }));
        },
    });

    const handleRecord = async (form: ExecutionResultFormType) => {
        try {
            await recordMutation.mutateAsync(form);
        } catch (error) {
            // Results are recorded once: someone else was first. Show theirs.
            if (getApiErrorCode(error) === API_ERROR_CODE.CONFLICT) {
                message.warning(t('notifications.alreadyRecorded'));
                await queryClient.invalidateQueries({ queryKey: detailsKey });
                return;
            }

            console.error('Failed to record the result:', error);
            message.error(t('notifications.recordError'));
        }
    };

    if (!isValidExecutionId || getApiErrorCode(executionQuery.error) === API_ERROR_CODE.NOT_FOUND) {
        return <NotFoundState />;
    }

    if (executionQuery.isError) {
        return <QueryErrorState onRetry={() => void executionQuery.refetch()} />;
    }

    if (!execution || (isPending && testCaseId !== null && testCaseQuery.isPending)) {
        return <QueryLoadingState />;
    }

    // Execution controls are shown disabled, with the reason, to a role that may only look (ui-requirements
    // §2 rule 3) — not hidden.
    const canRecord = can(RESOURCE_CODE.TEST_EXECUTION, PERMISSION_CODE.UPDATE);
    const readOnlyReason = canRecord ? undefined : t('form.readOnly', { role: session?.role.name });
    const canRunAgain = !isPending && testCaseId !== null && can(RESOURCE_CODE.TEST_EXECUTION, PERMISSION_CODE.CREATE);
    // Only a failed run without a defect can get one (the API: 409 otherwise). Shown disabled with the reason
    // to a role that can't create defects, like the other execution controls (ui-requirements §2 rule 3).
    const canHaveDefect = execution.status === 'FAIL' && !execution.defect && can(RESOURCE_CODE.DEFECT, PERMISSION_CODE.READ);
    const canCreateDefect = can(RESOURCE_CODE.DEFECT, PERMISSION_CODE.CREATE);

    const stepColumns: TableColumnsType<TestExecutionStepType> = [
        { title: t('view.orderColumn'), dataIndex: 'order', key: 'order', width: 56 },
        { title: t('view.actionColumn'), key: 'action', render: (_, step) => <span className={styles['tb-execution-page__text']}>{step.action}</span> },
        {
            title: t('view.expectedResultColumn'),
            key: 'expectedResult',
            render: (_, step) => <span className={styles['tb-execution-page__text']}>{step.expectedResult}</span>,
        },
        { title: t('view.resultColumn'), key: 'status', render: (_, step) => (step.status ? <ExecutionResultTag result={step.status} /> : EMPTY_VALUE) },
        { title: t('view.commentColumn'), key: 'comment', render: (_, step) => step.comment || EMPTY_VALUE },
    ];

    // New attachments show in the table and as an audit entry.
    const refreshAttachments = () => Promise.all([
        queryClient.invalidateQueries({ queryKey: detailsKey }),
        queryClient.invalidateQueries({ queryKey: testExecutionAuditQueryKey(project.id, execution.id) }),
    ]);

    // Shown on a pending run too, disabled: the API takes attachments only once the result is recorded, and a
    // missing section would read as a bug. The role's reason first — recording won't change that one.
    const attachmentsDisabledReason = !canRecord
        ? tAttachment('upload.readOnly', { role: session?.role.name })
        : isPending ? t('view.attachmentsPending') : undefined;

    const attachmentsSection = (
        <section aria-labelledby="execution-attachments-title">
            <Typography.Title level={4} id="execution-attachments-title">
                {t('view.attachmentsTitle', { count: execution.attachments.length })}
            </Typography.Title>
            <Flex vertical gap="middle">
                <AttachmentUploader
                    projectId={project.id}
                    executionId={execution.id}
                    disabledReason={attachmentsDisabledReason}
                    onUploaded={refreshAttachments}
                />
                {!isPending && <AttachmentTable attachments={execution.attachments} />}
            </Flex>
        </section>
    );

    return (
        <>
            <PageHeader
                title={execution.testCaseTitle}
                actions={(
                    <>
                        {canHaveDefect && (
                            <Tooltip title={canCreateDefect ? undefined : tDefect('action.readOnly', { role: session?.role.name })}>
                                <Button danger disabled={!canCreateDefect} onClick={() => setIsDefectDialogOpen(true)}>
                                    {tDefect('action.create')}
                                </Button>
                            </Tooltip>
                        )}
                        {canRunAgain && (
                            <Button type="primary" onClick={() => void navigate(`/projects/${project.id}/test-cases/${testCaseId}/execute`)}>
                                {t('page.runAgain')}
                            </Button>
                        )}
                    </>
                )}
            />

            <Flex vertical gap="large">
                <Descriptions
                    bordered
                    column={{ xs: 1, md: 2 }}
                    items={[
                        { key: 'status', label: t('view.statusLabel'), children: <ExecutionStatusTag status={execution.status} /> },
                        {
                            key: 'testCase',
                            label: t('view.testCaseLabel'),
                            children: testCaseId !== null
                                ? <Link to={`/projects/${project.id}/test-cases/${testCaseId}`}>{t('page.openTestCase')}</Link>
                                : <Typography.Text type="secondary">{t('view.deletedTestCase')}</Typography.Text>,
                        },
                        { key: 'assignee', label: t('view.assigneeLabel'), children: <UserReferenceName user={execution.assignee} /> },
                        { key: 'executedBy', label: t('view.executedByLabel'), children: <UserReferenceName user={execution.executedBy} /> },
                        { key: 'executedAt', label: t('view.executedAtLabel'), children: execution.executedAt ? formatDateTime(execution.executedAt) : EMPTY_VALUE },
                        { key: 'createdAt', label: t('view.createdAtLabel'), children: formatDateTime(execution.createdAt) },
                        ...(execution.suiteRunId !== null
                            ? [{
                                key: 'suiteRun',
                                label: t('view.suiteRunLabel'),
                                children: <Link to={`/projects/${project.id}/suite-runs/${execution.suiteRunId}`}>{t('view.openSuiteRun')}</Link>,
                            }]
                            : []),
                        ...(!isPending
                            ? [{ key: 'comment', label: t('view.commentLabel'), span: 'filled' as const, children: execution.comment || EMPTY_VALUE }]
                            : []),
                    ]}
                />

                {isPending ? (
                    <>
                        <ExecutionResultForm
                            steps={execution.steps}
                            preConditions={testCaseQuery.data?.preConditions}
                            postConditions={testCaseQuery.data?.postConditions}
                            readOnlyReason={readOnlyReason}
                            onSubmit={handleRecord}
                            onCancel={() => void navigate(queuePath, FORM_EXIT_NAVIGATION)}
                            isSubmitting={recordMutation.isPending}
                        />
                        {attachmentsSection}
                    </>
                ) : (
                    <>
                        <section aria-labelledby="execution-steps-title">
                            <Typography.Title level={4} id="execution-steps-title">{t('view.stepsTitle')}</Typography.Title>
                            <Table<TestExecutionStepType>
                                rowKey="order"
                                size="small"
                                columns={stepColumns}
                                dataSource={execution.steps}
                                pagination={false}
                                scroll={{ x: 'max-content' }}
                            />
                        </section>

                        {execution.defect && (
                            <section aria-labelledby="execution-defect-title">
                                <Typography.Title level={4} id="execution-defect-title">{t('view.defectTitle')}</Typography.Title>
                                <DefectCard defect={execution.defect} unknownUserLabel={t('audit.unknownUser')} />
                            </section>
                        )}

                        {attachmentsSection}
                    </>
                )}

                {isDefectDialogOpen && (
                    <CreateDefectDialog
                        projectId={project.id}
                        executionId={execution.id}
                        run={{ testCaseTitle: execution.testCaseTitle, comment: execution.comment, steps: execution.steps }}
                        onClose={() => setIsDefectDialogOpen(false)}
                    />
                )}

                <section aria-labelledby="execution-audit-title">
                    <Typography.Title level={4} id="execution-audit-title">{t('view.auditTitle')}</Typography.Title>
                    <ExecutionAuditTrail executionId={execution.id} />
                </section>
            </Flex>
        </>
    );
}
