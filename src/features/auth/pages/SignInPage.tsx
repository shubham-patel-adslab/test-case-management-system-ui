import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Navigate, useSearchParams } from 'react-router';
import type { TFunction } from 'i18next';
import { Alert, Button, Form } from 'antd';

import { useAuth } from '../auth.context';
import { RETURN_TO_PARAM } from '../auth.constant';
import { authSignInFormSchema } from '../auth.schema';
import type { AuthSignInFormType } from '../auth.type';
import { API_ERROR_CODE, getApiErrorCode } from '../../../app/api-error';
import { AuthPageLayout } from '../components/AuthPageLayout';
import { FormTextField } from '../../../shared/components/form/FormTextField';

const DEFAULT_REDIRECT_PATH = '/';

// Only in-app paths: "/projects" is fine, "//evil.example" or "https://…" would be an open redirect.
function getSafeReturnTo(returnTo: string | null): string {
    const isInAppPath = !!returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//')
        && !returnTo.startsWith('/\\');

    return isInAppPath ? returnTo : DEFAULT_REDIRECT_PATH;
}

function getSignInErrorMessage(error: unknown, t: TFunction): string {
    switch (getApiErrorCode(error)) {
        case API_ERROR_CODE.INVALID_CREDENTIALS:
            return t('errors.invalidCredentials');
        case API_ERROR_CODE.ACCOUNT_INACTIVE:
            return t('errors.accountInactive');
        default:
            return t('errors.generic');
    }
}

export function SignInPage() {
    const { t } = useTranslation('auth');
    const { session, signIn } = useAuth();
    const [searchParams] = useSearchParams();

    const signInMutation = useMutation({ mutationFn: signIn });

    const {
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<AuthSignInFormType>({
        resolver: zodResolver(authSignInFormSchema),
        defaultValues: { email: '', password: '' },
    });

    // Already signed in, or just signed in: the session in context changed, so leave declaratively.
    if (session) {
        return <Navigate to={getSafeReturnTo(searchParams.get(RETURN_TO_PARAM))} replace />;
    }

    const errorMessage = signInMutation.error ? getSignInErrorMessage(signInMutation.error, t) : undefined;

    return (
        <AuthPageLayout
            title={t('page.title')}
            alert={errorMessage && <Alert type="error" title={errorMessage} showIcon />}
        >
            {/* Server errors don't block a retry; only the in-flight request disables the button
                (no double submits). */}
            <form onSubmit={(event) => { void handleSubmit((data) => signInMutation.mutate(data))(event); }}>
                <Form layout="vertical" component={false}>
                    <FormTextField
                        name="email"
                        label={t('form.emailLabel')}
                        control={control}
                        error={errors.email}
                        t={t}
                        type="email"
                        required
                    />

                    <FormTextField
                        name="password"
                        label={t('form.passwordLabel')}
                        control={control}
                        error={errors.password}
                        t={t}
                        type="password"
                        required
                    />

                    <Button
                        type="primary"
                        htmlType="submit"
                        block
                        loading={signInMutation.isPending}
                        disabled={signInMutation.isPending}
                    >
                        {t('form.submit')}
                    </Button>
                </Form>
            </form>
        </AuthPageLayout>
    );
}
