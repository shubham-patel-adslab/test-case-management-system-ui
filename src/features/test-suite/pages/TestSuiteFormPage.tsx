import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { App } from 'antd';

import { TestSuiteForm } from '../components/TestSuiteForm';
import { createTestSuite, getTestSuite, updateTestSuite } from '../test-suite.api';
import {
    toTestSuiteCreateRequestDto,
    toTestSuiteDetails,
    toTestSuiteFormValues,
    toTestSuiteUpdateRequestDto,
} from '../test-suite.mapper';
import { testSuiteDetailsQueryKey, testSuitesQueryKey } from '../test-suite.query';
import type { TestSuiteFormServerError, TestSuiteFormType } from '../test-suite.type';
import { useCurrentProject } from '../../project/current-project.context';
import { API_ERROR_CODE, getApiErrorCode } from '../../../app/api-error';
import { FORM_EXIT_NAVIGATION } from '../../../shared/components/form/FormActions';
import { NotFoundState } from '../../../shared/components/NotFoundState';
import { PageHeader } from '../../../shared/components/PageHeader';
import { QueryErrorState } from '../../../shared/components/QueryErrorState';
import { QueryLoadingState } from '../../../shared/components/QueryLoadingState';
import { useNumericRouteParam } from '../../../shared/hooks/useNumericRouteParam';

export function TestSuiteFormPage() {
    const { t } = useTranslation('testSuite');
    const navigate = useNavigate();
    const { message } = App.useApp();
    const queryClient = useQueryClient();
    const project = useCurrentProject();

    const { suiteId: suiteIdParam } = useParams();
    const { value: suiteId, isValid: isValidSuiteId } = useNumericRouteParam(suiteIdParam);
    const isUpdateMode = suiteId !== undefined;

    const listPath = `/projects/${project.id}/test-suites`;

    const suiteQuery = useQuery({
        queryKey: testSuiteDetailsQueryKey(project.id, suiteId),
        queryFn: ({ signal }) => getTestSuite(project.id, suiteId!, signal),
        enabled: isUpdateMode && isValidSuiteId,
        select: toTestSuiteDetails,
    });

    const saveMutation = useMutation({
        mutationFn: (data: TestSuiteFormType) => (isUpdateMode
            ? updateTestSuite(project.id, toTestSuiteUpdateRequestDto(suiteId, data))
            : createTestSuite(project.id, toTestSuiteCreateRequestDto(data))),
    });

    const handleSubmit = async (data: TestSuiteFormType): Promise<TestSuiteFormServerError[] | undefined> => {
        try {
            const suite = await saveMutation.mutateAsync(data);

            await queryClient.invalidateQueries({ queryKey: testSuitesQueryKey(project.id) });
            message.success(isUpdateMode ? t('notifications.updateSuccess') : t('notifications.createSuccess'));
            void navigate(`${listPath}/${suite.id}`, FORM_EXIT_NAVIGATION);

            return undefined;
        } catch (error) {
            const code = getApiErrorCode(error);

            // Suite names are unique per project, ignoring case (409 on `name`): keep the form, mark the field.
            if (code === API_ERROR_CODE.CONFLICT) {
                return [{ name: 'name', message: 'validation.nameTaken' }];
            }

            // Deleted by someone else while the form was open.
            if (isUpdateMode && code === API_ERROR_CODE.NOT_FOUND) {
                message.error(t('notifications.notFoundAnymore'));
                void navigate(listPath, FORM_EXIT_NAVIGATION);
                return undefined;
            }

            console.error('Failed to create/update test suite:', error);
            message.error(t('notifications.saveError'));

            return undefined;
        }
    };

    if (!isValidSuiteId || getApiErrorCode(suiteQuery.error) === API_ERROR_CODE.NOT_FOUND) {
        return <NotFoundState />;
    }

    if (suiteQuery.isError) {
        return <QueryErrorState onRetry={() => void suiteQuery.refetch()} />;
    }

    if (isUpdateMode && !suiteQuery.data) {
        return <QueryLoadingState />;
    }

    return (
        <>
            <PageHeader title={isUpdateMode ? t('page.updateTitle') : t('page.createTitle')} />
            <TestSuiteForm
                defaultValues={suiteQuery.data && toTestSuiteFormValues(suiteQuery.data)}
                onSubmit={handleSubmit}
                // Back to where the user came from: the suite for an update, the list for a create.
                onCancel={() => void navigate(isUpdateMode ? `${listPath}/${suiteId}` : listPath, FORM_EXIT_NAVIGATION)}
                isSubmitting={saveMutation.isPending}
            />
        </>
    );
}
