import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { App, Form, Modal } from 'antd';

import { createDefect } from '../defect.api';
import { DEFECT_SEVERITIES } from '../defect.constant';
import { toDefectCreateRequestDto } from '../defect.mapper';
import { toDefectFormPrefill, type FailedRunForDefect } from '../defect.prefill';
import { defectFormSchema } from '../defect.schema';
import type { DefectFormType } from '../defect.type';
import { suiteRunsQueryKey } from '../../suite-run/suite-run.query';
import { testExecutionsQueryKey } from '../../test-execution/test-execution.query';
import { API_ERROR_CODE, getApiErrorCode } from '../../../app/api-error';
import { FormActions } from '../../../shared/components/form/FormActions';
import { FormSelectField } from '../../../shared/components/form/FormSelectField';
import { FormTextAreaField } from '../../../shared/components/form/FormTextAreaField';
import { FormTextField } from '../../../shared/components/form/FormTextField';

const DESCRIPTION_ROWS = 10;

type CreateDefectDialogProps = {
    projectId: number;
    executionId: number;
    run: FailedRunForDefect;
    // The page mounts the dialog only while it's open, so every opening starts from the prefill.
    onClose: () => void;
};

// Raise a defect from a failed run (PRD Features §4; one per run). Prefilled from the run; the user edits it.
export function CreateDefectDialog({ projectId, executionId, run, onClose }: CreateDefectDialogProps) {
    const { t } = useTranslation('defect');
    const { message } = App.useApp();
    const queryClient = useQueryClient();

    const {
        control,
        handleSubmit,
        formState: { errors, isDirty },
    } = useForm<DefectFormType>({
        resolver: zodResolver(defectFormSchema),
        defaultValues: toDefectFormPrefill(run, t),
    });

    // The run shows its defect; lists show it on the run's row (queue, history, suite reports); the audit
    // trail gets an entry.
    const refreshRun = () => Promise.all([
        queryClient.invalidateQueries({ queryKey: testExecutionsQueryKey(projectId) }),
        queryClient.invalidateQueries({ queryKey: suiteRunsQueryKey(projectId) }),
    ]);

    const createMutation = useMutation({
        mutationFn: (form: DefectFormType) => createDefect(projectId, executionId, toDefectCreateRequestDto(form)),
        onSuccess: async () => {
            await refreshRun();
            message.success(t('notifications.created'));
            onClose();
        },
        onError: async (error) => {
            // Someone else raised one first (or the run isn't a failure): show the run as it is now.
            if (getApiErrorCode(error) === API_ERROR_CODE.CONFLICT) {
                await refreshRun();
                message.warning(t('notifications.conflict'));
                onClose();
                return;
            }

            console.error('Failed to create the defect:', error);
            message.error(t('notifications.error'));
        },
    });

    return (
        <Modal open title={t('form.dialogTitle')} footer={null} onCancel={onClose} width={720}>
            <form onSubmit={(event) => { void handleSubmit((form) => createMutation.mutate(form))(event); }}>
                <Form layout="vertical" component={false}>
                    <FormTextField name="title" label={t('form.titleLabel')} control={control} error={errors.title} t={t} required />
                    <FormSelectField
                        name="severity"
                        label={t('form.severityLabel')}
                        control={control}
                        options={DEFECT_SEVERITIES.map((severity) => ({ value: severity, label: t(`severity.${severity}`) }))}
                        error={errors.severity}
                        t={t}
                        required
                    />
                    <FormTextAreaField
                        name="description"
                        label={t('form.descriptionLabel')}
                        control={control}
                        error={errors.description}
                        t={t}
                        rows={DESCRIPTION_ROWS}
                    />
                    <FormActions
                        submitLabel={t('form.submit')}
                        isSubmitting={createMutation.isPending}
                        isSubmitDisabled={createMutation.isPending}
                        isDirty={isDirty}
                        onCancel={onClose}
                    />
                </Form>
            </form>
        </Modal>
    );
}
