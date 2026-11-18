import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { App, Button, Flex, Popconfirm, Select, Typography } from 'antd';

import styles from './TestCaseBulkActions.module.scss';
import { bulkUpdateTestCases } from '../test-case.api';
import { TEST_CASE_BULK_ACTION, TEST_CASE_PRIORITIES } from '../test-case.constant';
import { testCasesQueryKey } from '../test-case.query';
import type { TestCaseBulkRequestDto } from '../test-case.request.dto';
import type { TestCasePriority } from '../test-case.type';
import { useAuth } from '../../auth/auth.context';
import { PERMISSION_CODE, RESOURCE_CODE } from '../../auth/auth.constant';
import { useCurrentProject } from '../../project/current-project.context';
import { assignTestCases } from '../../test-execution/test-execution.api';
import { testExecutionsQueryKey } from '../../test-execution/test-execution.query';
import { testSuitesQueryKey } from '../../test-suite/test-suite.query';
import type { TestSuiteOption } from '../../test-suite/useTestSuiteOptions';
import { API_ERROR_CODE, getApiErrorCode, getApiErrorDetails } from '../../../app/api-error';
import { formatFullName } from '../../../shared/format/name.format';

type TestCaseBulkActionsProps = {
    projectId: number;
    // 1–100: the selection never spans more than one list page.
    selectedIds: number[];
    suiteOptions: TestSuiteOption[];
    // After an action (or "Clear selection"): the page clears its selection.
    onClearSelection: () => void;
};

// The toolbar over the test case list while rows are selected (PRD Features §3: bulk delete, update
// priority, assign to suite; §4: assign test cases to testers). One API call per action, not one per row;
// all-or-nothing on the server. Each control shows only with its own permission.
export function TestCaseBulkActions({ projectId, selectedIds, suiteOptions, onClearSelection }: TestCaseBulkActionsProps) {
    const { t } = useTranslation('testCase');
    const { message } = App.useApp();
    const queryClient = useQueryClient();
    const { can } = useAuth();
    const project = useCurrentProject();

    const suiteName = (suiteId: number) => suiteOptions.find((option) => option.value === suiteId)?.label ?? `#${suiteId}`;

    const successMessage = (request: TestCaseBulkRequestDto, count: number): string => {
        switch (request.action) {
            case TEST_CASE_BULK_ACTION.DELETE:
                return t('bulk.deleted', { count });
            case TEST_CASE_BULK_ACTION.UPDATE_PRIORITY:
                return t('bulk.priorityUpdated', { count, priority: t(`priority.${request.priority}`) });
            case TEST_CASE_BULK_ACTION.ASSIGN_TO_SUITE: {
                const suite = suiteName(request.suiteId);
                const alreadyIn = request.testCaseIds.length - count;

                if (count === 0) {
                    return t('bulk.allAlreadyInSuite', { count: alreadyIn, suite });
                }

                const added = t('bulk.addedToSuite', { count, suite });

                return alreadyIn > 0 ? `${added} — ${t('bulk.alreadyInSuite', { count: alreadyIn })}` : added;
            }
        }
    };

    // Test case lists and details, and the suites (their test case counts change with membership).
    const refreshProjectContent = () => Promise.all([
        queryClient.invalidateQueries({ queryKey: testCasesQueryKey(projectId) }),
        queryClient.invalidateQueries({ queryKey: testSuitesQueryKey(projectId) }),
    ]);

    const bulkMutation = useMutation({
        mutationFn: (request: TestCaseBulkRequestDto) => bulkUpdateTestCases(projectId, request),
        onSuccess: async ({ affectedCount }, request) => {
            onClearSelection();
            await refreshProjectContent();
            message.success(successMessage(request, affectedCount));
        },
        onError: async (error) => {
            const code = getApiErrorCode(error);
            const fields = getApiErrorDetails(error).map((detail) => detail.field);

            // Someone deleted a selected case (or moved the suite) meanwhile: nothing changed on the server.
            if (code === API_ERROR_CODE.VALIDATION_ERROR && fields.some((field) => field.startsWith('testCaseIds'))) {
                onClearSelection();
                await refreshProjectContent();
                message.warning(t('bulk.staleSelection'));
                return;
            }

            if (code === API_ERROR_CODE.VALIDATION_ERROR && fields.includes('suiteId')) {
                await queryClient.invalidateQueries({ queryKey: testSuitesQueryKey(projectId) });
                message.warning(t('bulk.suiteUnavailable'));
                return;
            }

            if (code === API_ERROR_CODE.FORBIDDEN) {
                message.error(t('bulk.forbidden'));
                return;
            }

            console.error('Bulk test case action failed:', error);
            message.error(t('bulk.error'));
        },
    });

    // Any active team member can be picked (user decision 2026-11-17: the role decides what they can do);
    // the API refuses one whose role can't run tests (400 on assigneeId) — explained, not filtered by role.
    const assigneeOptions = project.members
        .filter((member) => member.status === 'ACTIVE')
        .map((member) => ({ value: member.id, label: formatFullName(member.firstName, member.lastName) }));
    const assigneeName = (assigneeId: string) => assigneeOptions.find((option) => option.value === assigneeId)?.label ?? '';

    const assignMutation = useMutation({
        mutationFn: (assigneeId: string) => assignTestCases(projectId, { testCaseIds: selectedIds, assigneeId }),
        onSuccess: async ({ createdCount }, assigneeId) => {
            onClearSelection();
            await queryClient.invalidateQueries({ queryKey: testExecutionsQueryKey(projectId) });

            // Cases already waiting for this assignee are skipped by the API.
            const name = assigneeName(assigneeId);
            const skipped = selectedIds.length - createdCount;

            if (createdCount === 0) {
                message.info(t('bulk.allAlreadyPending', { count: skipped, name }));
                return;
            }

            const assigned = t('bulk.assigned', { count: createdCount, name });
            message.success(skipped > 0 ? `${assigned} — ${t('bulk.alreadyPending', { count: skipped })}` : assigned);
        },
        onError: async (error, assigneeId) => {
            const code = getApiErrorCode(error);
            const fields = getApiErrorDetails(error).map((detail) => detail.field);

            if (code === API_ERROR_CODE.VALIDATION_ERROR && fields.includes('assigneeId')) {
                message.warning(t('bulk.assigneeCannotExecute', { name: assigneeName(assigneeId) }));
                return;
            }

            if (code === API_ERROR_CODE.VALIDATION_ERROR && fields.some((field) => field.startsWith('testCaseIds'))) {
                onClearSelection();
                await refreshProjectContent();
                message.warning(t('bulk.staleSelection'));
                return;
            }

            console.error('Assigning test cases failed:', error);
            message.error(code === API_ERROR_CODE.FORBIDDEN ? t('bulk.forbidden') : t('bulk.error'));
        },
    });

    const count = selectedIds.length;
    const isPending = bulkMutation.isPending || assignMutation.isPending;
    const canUpdate = can(RESOURCE_CODE.TEST_CASE, PERMISSION_CODE.UPDATE);

    return (
        <Flex
            className={styles['tb-test-case-bulk-actions']}
            role="toolbar"
            aria-label={t('bulk.toolbarLabel')}
            gap="small"
            wrap
            align="center"
        >
            <Typography.Text strong>{t('bulk.selected', { count })}</Typography.Text>
            {/* Action pickers: always empty, a choice applies right away. */}
            {can(RESOURCE_CODE.TEST_ASSIGNMENT, PERMISSION_CODE.CREATE) && (
                <Select<string>
                    className={styles['tb-test-case-bulk-actions__select']}
                    aria-label={t('bulk.assignTo')}
                    placeholder={t('bulk.assignTo')}
                    value={null}
                    showSearch={{ optionFilterProp: 'label' }}
                    disabled={isPending}
                    options={assigneeOptions}
                    onChange={(assigneeId) => assignMutation.mutate(assigneeId)}
                />
            )}
            {canUpdate && (
                <Select<TestCasePriority>
                    className={styles['tb-test-case-bulk-actions__select']}
                    aria-label={t('bulk.changePriority')}
                    placeholder={t('bulk.changePriority')}
                    value={null}
                    disabled={isPending}
                    options={TEST_CASE_PRIORITIES.map((priority) => ({ value: priority, label: t(`priority.${priority}`) }))}
                    onChange={(priority) => bulkMutation.mutate({
                        action: TEST_CASE_BULK_ACTION.UPDATE_PRIORITY,
                        testCaseIds: selectedIds,
                        priority,
                    })}
                />
            )}
            {canUpdate && (
                <Select<number>
                    className={styles['tb-test-case-bulk-actions__select']}
                    aria-label={t('bulk.addToSuite')}
                    placeholder={t('bulk.addToSuite')}
                    value={null}
                    showSearch={{ optionFilterProp: 'label' }}
                    disabled={isPending}
                    options={suiteOptions}
                    onChange={(suiteId) => bulkMutation.mutate({
                        action: TEST_CASE_BULK_ACTION.ASSIGN_TO_SUITE,
                        testCaseIds: selectedIds,
                        suiteId,
                    })}
                />
            )}
            {/* The API's bulk delete needs TEST_CASE UPDATE and DELETE. */}
            {canUpdate && can(RESOURCE_CODE.TEST_CASE, PERMISSION_CODE.DELETE) && (
                <Popconfirm
                    title={t('bulk.deleteTitle', { count })}
                    description={t('bulk.deleteDescription')}
                    okText={t('bulk.delete')}
                    okButtonProps={{ danger: true }}
                    cancelText={t('action.cancel')}
                    onConfirm={() => bulkMutation.mutate({ action: TEST_CASE_BULK_ACTION.DELETE, testCaseIds: selectedIds })}
                >
                    <Button danger disabled={isPending}>{t('bulk.delete')}</Button>
                </Popconfirm>
            )}
            <Button type="link" onClick={onClearSelection} disabled={isPending}>
                {t('bulk.clearSelection')}
            </Button>
        </Flex>
    );
}
