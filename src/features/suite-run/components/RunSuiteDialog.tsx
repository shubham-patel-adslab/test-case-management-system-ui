import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { App, Form, Modal, Select, Typography } from 'antd';

import { runTestSuite } from '../suite-run.api';
import { SUITE_RUN_UNASSIGNED } from '../suite-run.constant';
import { suiteRunsQueryKey } from '../suite-run.query';
import { useAuth } from '../../auth/auth.context';
import { PERMISSION_CODE, RESOURCE_CODE } from '../../auth/auth.constant';
import { useCurrentProject } from '../../project/current-project.context';
import { testExecutionsQueryKey } from '../../test-execution/test-execution.query';
import { API_ERROR_CODE, getApiErrorCode, getApiErrorDetails } from '../../../app/api-error';
import { formatFullName } from '../../../shared/format/name.format';

type RunSuiteDialogProps = {
    suite: { id: number; name: string; testCaseCount: number };
    // The page mounts the dialog only while it's open, so every opening starts from the default.
    onClose: () => void;
};

// Run a whole suite (PRD Features §6): one pending execution per test case, in suite order, then the run's
// report. The run is for me by default; unassigned, or someone else if I may assign (TEST_ASSIGNMENT CREATE).
export function RunSuiteDialog({ suite, onClose }: RunSuiteDialogProps) {
    const { t } = useTranslation('suiteRun');
    const navigate = useNavigate();
    const { message } = App.useApp();
    const queryClient = useQueryClient();
    const { session, can } = useAuth();
    const project = useCurrentProject();
    const myId = session!.user.id;

    const [assignee, setAssignee] = useState<string>(myId);

    const teammates = can(RESOURCE_CODE.TEST_ASSIGNMENT, PERMISSION_CODE.CREATE)
        ? project.members
            .filter((member) => member.status === 'ACTIVE' && member.id !== myId)
            .map((member) => ({ value: member.id, label: formatFullName(member.firstName, member.lastName) }))
        : [];
    const options = [
        { value: myId, label: t('run.me') },
        { value: SUITE_RUN_UNASSIGNED, label: t('run.unassigned') },
        ...teammates,
    ];

    const runMutation = useMutation({
        mutationFn: () => runTestSuite(project.id, suite.id, assignee === SUITE_RUN_UNASSIGNED ? {} : { assigneeId: assignee }),
        onSuccess: async (run) => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: suiteRunsQueryKey(project.id) }),
                queryClient.invalidateQueries({ queryKey: testExecutionsQueryKey(project.id) }),
            ]);
            message.success(t('run.started', { count: run.progress.total }));
            onClose();
            void navigate(`/projects/${project.id}/suite-runs/${run.id}`);
        },
        onError: (error) => {
            const code = getApiErrorCode(error);

            if (code === API_ERROR_CODE.CONFLICT) {
                message.warning(t('run.emptyConflict'));
            } else if (code === API_ERROR_CODE.VALIDATION_ERROR && getApiErrorDetails(error).some((detail) => detail.field === 'assigneeId')) {
                message.warning(t('run.assigneeCannotExecute', { name: options.find((option) => option.value === assignee)?.label ?? '' }));
            } else if (code === API_ERROR_CODE.NOT_FOUND) {
                message.error(t('run.suiteGone'));
            } else if (code === API_ERROR_CODE.FORBIDDEN) {
                message.error(t('run.forbidden'));
            } else {
                console.error('Failed to run the suite:', error);
                message.error(t('run.error'));
            }
        },
    });

    return (
        <Modal
            open
            title={t('run.dialogTitle', { suite: suite.name })}
            okText={t('run.submit')}
            okButtonProps={{ loading: runMutation.isPending }}
            cancelText={t('run.cancel')}
            cancelButtonProps={{ disabled: runMutation.isPending }}
            onOk={() => runMutation.mutate()}
            onCancel={onClose}
        >
            <Typography.Paragraph>{t('run.dialogText', { count: suite.testCaseCount })}</Typography.Paragraph>
            <Form layout="vertical" component={false}>
                <Form.Item label={t('run.assigneeLabel')} htmlFor="suite-run-assignee">
                    <Select<string>
                        id="suite-run-assignee"
                        showSearch={{ optionFilterProp: 'label' }}
                        options={options}
                        value={assignee}
                        onChange={setAssignee}
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
}
