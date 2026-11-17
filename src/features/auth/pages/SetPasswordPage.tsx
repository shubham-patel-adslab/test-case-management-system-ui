import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router';
import { Alert, Button, Form, Result } from 'antd';

import { INVITATION_TOKEN_PARAM, SIGN_IN_PATH } from '../auth.constant';
import { acceptInvitation } from '../auth.api';
import { toInvitationAcceptRequestDto } from '../auth.mapper';
import { authSetPasswordFormSchema } from '../auth.schema';
import type { AuthSetPasswordFormType } from '../auth.type';
import { AuthPageLayout } from '../components/AuthPageLayout';
import { API_ERROR_CODE, getApiErrorCode } from '../../../app/api-error';
import { FormTextField } from '../../../shared/components/form/FormTextField';

// The invitation link is /set-password#token=… — a fragment never reaches a server or a Referer header.
function readInvitationToken(hash: string): string | null {
    return new URLSearchParams(hash.replace(/^#/, '')).get(INVITATION_TOKEN_PARAM);
}

type SetPasswordFormProps = {
    token: string;
};

// Keyed by the token (below), so opening a different link starts with fresh form and request state —
// an error from one link never sticks to the next.
function SetPasswordForm({ token }: SetPasswordFormProps) {
    const { t } = useTranslation('auth');

    const acceptMutation = useMutation({ mutationFn: acceptInvitation });

    const {
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<AuthSetPasswordFormType>({
        resolver: zodResolver(authSetPasswordFormSchema),
        defaultValues: { password: '', confirmPassword: '' },
    });

    if (acceptMutation.isSuccess) {
        return (
            <AuthPageLayout title={t('setPassword.title')}>
                <Result
                    status="success"
                    title={t('setPassword.successTitle')}
                    extra={<Link to={SIGN_IN_PATH}>{t('setPassword.signIn')}</Link>}
                />
            </AuthPageLayout>
        );
    }

    if (getApiErrorCode(acceptMutation.error) === API_ERROR_CODE.INVALID_INVITATION) {
        return <InvalidLinkState />;
    }

    return (
        <AuthPageLayout
            title={t('setPassword.title')}
            alert={acceptMutation.isError && <Alert type="error" title={t('setPassword.genericError')} showIcon />}
        >
            <form
                onSubmit={(event) => {
                    void handleSubmit((form) => acceptMutation.mutate(toInvitationAcceptRequestDto(token, form)))(event);
                }}
            >
                <Form layout="vertical" component={false}>
                    <FormTextField
                        name="password"
                        label={t('setPassword.passwordLabel')}
                        control={control}
                        error={errors.password}
                        t={t}
                        type="password"
                        required
                    />

                    <FormTextField
                        name="confirmPassword"
                        label={t('setPassword.confirmPasswordLabel')}
                        control={control}
                        error={errors.confirmPassword}
                        t={t}
                        type="password"
                        required
                    />

                    <Button
                        type="primary"
                        htmlType="submit"
                        block
                        loading={acceptMutation.isPending}
                        disabled={acceptMutation.isPending}
                    >
                        {t('setPassword.submit')}
                    </Button>
                </Form>
            </form>
        </AuthPageLayout>
    );
}

function InvalidLinkState() {
    const { t } = useTranslation('auth');

    return (
        <AuthPageLayout title={t('setPassword.title')}>
            <Result status="warning" title={t('setPassword.invalidLink')} />
        </AuthPageLayout>
    );
}

export function SetPasswordPage() {
    const { hash } = useLocation();
    const token = readInvitationToken(hash);

    // No token: the link is broken — no point calling the API.
    if (!token) {
        return <InvalidLinkState />;
    }

    return <SetPasswordForm key={token} token={token} />;
}
