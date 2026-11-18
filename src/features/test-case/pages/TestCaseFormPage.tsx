import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { App } from 'antd';

import { TestCaseForm } from '../components/TestCaseForm';
import { createTestCase, getTestCase, updateTestCase } from '../test-case.api';
import {
    toTestCaseCreateRequestDto,
    toTestCaseDetails,
    toTestCaseFormServerErrors,
    toTestCaseFormValues,
    toTestCaseUpdateRequestDto,
} from '../test-case.mapper';
import { testCaseDetailsQueryKey, testCasesQueryKey } from '../test-case.query';
import type { TestCaseFormServerError, TestCaseFormType } from '../test-case.type';
import { useCurrentProject } from '../../project/current-project.context';
import { testSuitesQueryKey } from '../../test-suite/test-suite.query';
import { useTestSuiteOptions } from '../../test-suite/useTestSuiteOptions';
import { API_ERROR_CODE, getApiErrorCode, getApiErrorDetails } from '../../../app/api-error';
import { FORM_EXIT_NAVIGATION } from '../../../shared/components/form/FormActions';
import { NotFoundState } from '../../../shared/components/NotFoundState';
import { PageHeader } from '../../../shared/components/PageHeader';
import { QueryErrorState } from '../../../shared/components/QueryErrorState';
import { QueryLoadingState } from '../../../shared/components/QueryLoadingState';
import { useNumericRouteParam } from '../../../shared/hooks/useNumericRouteParam';

export function TestCaseFormPage() {
    const { t } = useTranslation('testCase');
    const navigate = useNavigate();
    const { message } = App.useApp();
    const queryClient = useQueryClient();
    const project = useCurrentProject();

    const { testCaseId: testCaseIdParam } = useParams();
    const { value: testCaseId, isValid: isValidTestCaseId } = useNumericRouteParam(testCaseIdParam);
    const isUpdateMode = testCaseId !== undefined;

    const listPath = `/projects/${project.id}/test-cases`;

    const testCaseQuery = useQuery({
        queryKey: testCaseDetailsQueryKey(project.id, testCaseId),
        queryFn: ({ signal }) => getTestCase(project.id, testCaseId!, signal),
        enabled: isUpdateMode && isValidTestCaseId,
        select: toTestCaseDetails,
    });

    const suiteOptionsQuery = useTestSuiteOptions(project.id);

    const saveMutation = useMutation({
        mutationFn: (data: TestCaseFormType) => (isUpdateMode
            ? updateTestCase(project.id, toTestCaseUpdateRequestDto(testCaseId, data))
            : createTestCase(project.id, toTestCaseCreateRequestDto(data))),
    });

    const handleSubmit = async (data: TestCaseFormType): Promise<TestCaseFormServerError[] | undefined> => {
        try {
            const testCase = await saveMutation.mutateAsync(data);

            // The test case lists and details, and the suites (their test case counts change with suiteIds).
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: testCasesQueryKey(project.id) }),
                queryClient.invalidateQueries({ queryKey: testSuitesQueryKey(project.id) }),
            ]);

            message.success(isUpdateMode ? t('notifications.updateSuccess') : t('notifications.createSuccess'));
            void navigate(`${listPath}/${testCase.id}`, FORM_EXIT_NAVIGATION);

            return undefined;
        } catch (error) {
            const code = getApiErrorCode(error);

            // Deleted by someone else while the form was open.
            if (isUpdateMode && code === API_ERROR_CODE.NOT_FOUND) {
                message.error(t('notifications.notFoundAnymore'));
                void navigate(listPath, FORM_EXIT_NAVIGATION);
                return undefined;
            }

            const fieldErrors = code === API_ERROR_CODE.VALIDATION_ERROR
                ? toTestCaseFormServerErrors(getApiErrorDetails(error))
                : [];

            if (fieldErrors.length === 0) {
                console.error('Failed to create/update test case:', error);
                message.error(t('notifications.saveError'));
            }

            return fieldErrors;
        }
    };

    if (getApiErrorCode(testCaseQuery.error) === API_ERROR_CODE.NOT_FOUND || !isValidTestCaseId) {
        return <NotFoundState />;
    }

    if (testCaseQuery.isError) {
        return <QueryErrorState onRetry={() => void testCaseQuery.refetch()} />;
    }

    if (isUpdateMode && !testCaseQuery.data) {
        return <QueryLoadingState />;
    }

    return (
        <>
            <PageHeader title={isUpdateMode ? t('page.updateTitle') : t('page.createTitle')} />
            <TestCaseForm
                defaultValues={testCaseQuery.data && toTestCaseFormValues(testCaseQuery.data)}
                suiteOptions={suiteOptionsQuery.data ?? []}
                isSuitesLoading={suiteOptionsQuery.isPending}
                hasSuitesError={suiteOptionsQuery.isError}
                onSubmit={handleSubmit}
                // Back to where the user came from: the test case for an update, the list for a create.
                onCancel={() => void navigate(isUpdateMode ? `${listPath}/${testCaseId}` : listPath, FORM_EXIT_NAVIGATION)}
                isSubmitting={saveMutation.isPending}
            />
        </>
    );
}
