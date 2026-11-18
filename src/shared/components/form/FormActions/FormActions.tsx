import { useTranslation } from 'react-i18next';
import { NavigationType, useBlocker } from 'react-router';
import { Button, Flex, Form, Modal, Popconfirm, Tooltip } from 'antd';

import { isFormExit } from './form-exit';

type FormActionsProps = {
    submitLabel: string;
    isSubmitting: boolean;
    // Create forms: only while submitting. Update forms: also until something changed.
    isSubmitDisabled: boolean;
    // react-hook-form's isDirty — decides whether leaving asks before discarding.
    isDirty: boolean;
    // Leaves the form without saving; the page decides where to go (with FORM_EXIT_NAVIGATION, form-exit.ts).
    onCancel: () => void;
    // Why submitting isn't possible, shown on the (disabled) submit button — e.g. a role that may only view
    // (ui-requirements §2 rule 3: shown disabled with a tooltip, not hidden).
    submitTooltip?: string;
};

// Submit + Cancel for every form. Leaving with unsaved changes (create or update) asks for confirmation
// first — through Cancel, and through any other navigation (sidebar, links, browser back); without
// changes it leaves straight away (ui-requirements §5.8).
export function FormActions({ submitLabel, isSubmitting, isSubmitDisabled, isDirty, onCancel, submitTooltip }: FormActionsProps) {
    const { t } = useTranslation('common');

    // Only page changes count: query-string-only changes on the same page aren't leaving it. The exit marker
    // is trusted only on the form's own push/replace — browser back/forward (POP) lands on an older history
    // entry that may carry a marker from an earlier exit. Closing the tab or reloading isn't covered (the
    // browser's own prompt can't be styled; decided against for now).
    const blocker = useBlocker(({ currentLocation, nextLocation, historyAction }) => isDirty
        && currentLocation.pathname !== nextLocation.pathname
        && (historyAction === NavigationType.Pop || !isFormExit(nextLocation)));

    return (
        <Form.Item>
            <Flex gap="small">
                <Tooltip title={submitTooltip}>
                    <Button type="primary" htmlType="submit" loading={isSubmitting} disabled={isSubmitDisabled}>
                        {submitLabel}
                    </Button>
                </Tooltip>
                <Popconfirm
                    title={t('form.discardTitle')}
                    description={t('form.discardDescription')}
                    okText={t('form.discard')}
                    okButtonProps={{ danger: true }}
                    cancelText={t('form.keepEditing')}
                    onConfirm={onCancel}
                    disabled={!isDirty}
                >
                    <Button onClick={isDirty ? undefined : onCancel} disabled={isSubmitting}>
                        {t('form.cancel')}
                    </Button>
                </Popconfirm>
            </Flex>
            <Modal
                open={blocker.state === 'blocked'}
                title={t('form.discardTitle')}
                okText={t('form.discard')}
                okButtonProps={{ danger: true }}
                cancelText={t('form.keepEditing')}
                onOk={() => blocker.proceed?.()}
                onCancel={() => blocker.reset?.()}
            >
                {t('form.discardDescription')}
            </Modal>
        </Form.Item>
    );
}
