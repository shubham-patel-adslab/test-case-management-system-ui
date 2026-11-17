import { useTranslation } from 'react-i18next';
import { Button, Flex, Form, Popconfirm } from 'antd';

type FormActionsProps = {
    submitLabel: string;
    isSubmitting: boolean;
    // Create forms: only while submitting. Update forms: also until something changed.
    isSubmitDisabled: boolean;
    // react-hook-form's isDirty — decides whether Cancel asks before discarding.
    isDirty: boolean;
    // Leaves the form without saving; the page decides where to go.
    onCancel: () => void;
};

// Submit + Cancel for every form. Cancel with unsaved changes (create or update) asks for confirmation
// first; without changes it leaves straight away.
export function FormActions({ submitLabel, isSubmitting, isSubmitDisabled, isDirty, onCancel }: FormActionsProps) {
    const { t } = useTranslation('common');

    return (
        <Form.Item>
            <Flex gap="small">
                <Button type="primary" htmlType="submit" loading={isSubmitting} disabled={isSubmitDisabled}>
                    {submitLabel}
                </Button>
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
        </Form.Item>
    );
}
