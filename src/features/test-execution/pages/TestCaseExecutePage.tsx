import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router';
import { App } from 'antd';

import { ExecutionResultForm } from '../components/ExecutionResultForm';
import { createTestExecution } from '../test-execution.api';
import { toTestExecutionCreateRequestDto } from '../test-execution.mapper';
import { testExecutionsQueryKey } from '../test-execution.query';
import type { ExecutionResultFormType, TestExecutionStepType } from '../test-execution.type';
import { useCurrentProject } from '../../project/current-project.context';
import { getTestCase } from '../../test-case/test-case.api';
import { toTestCaseDetails } from '../../test-case/test-case.mapper';
import { testCaseDetailsQueryKey, testCasesQueryKey } from '../../test-case/test-case.query';
import { API_ERROR_CODE, getApiErrorCode, getApiErrorDetails } from '../../../app/api-error';
import { FORM_EXIT_NAVIGATION } from '../../../shared/components/form/FormActions';
import { NotFoundState } from '../../../shared/components/NotFoundState';
import { PageHeader } from '../../../shared/components/PageHeader';
import { QueryErrorState } from '../../../shared/components/QueryErrorState';
import { QueryLoadingState } from '../../../shared/components/QueryLoadingState';
import { useNumericRouteParam } from '../../../shared/hooks/useNumericRouteParam';

// Run a test case ad hoc (ui-requirements §4.4): the same form as a pending run, recorded at once — no
// pending execution first. The route needs TEST_EXECUTION CREATE.
export function TestCaseExecutePage() {
    const { t } = useTranslation('testExecution');
    const { t: tTestCase } = useTranslation('testCase');
    const navigate = useNavigate();
    const { message } = App.useApp();
    const queryClient = useQueryClient();
    const project = useCurrentProject();

    const { testCaseId: testCaseIdParam } = useParams();
    const { value: testCaseId, isValid: isValidTestCaseId } = useNumericRouteParam(testCaseIdParam);
    const testCasePath = `/projects/${project.id}/test-cases/${testCaseId}`;

    const testCaseQuery = useQuery({
        queryKey: testCaseDetailsQueryKey(project.id, testCaseId),
        queryFn: ({ signal }) => getTestCase(project.id, testCaseId!, signal),
        enabled: isValidTestCaseId,
        select: toTestCaseDetails,
    });

    const runMutation = useMutation({
        mutationFn: (form: ExecutionResultFormType) => createTestExecution(project.id, toTestExecutionCreateRequestDto(testCaseId!, form)),
    });

    const handleRun = async (form: ExecutionResultFormType) => {
        try {
            const execution = await runMutation.mutateAsync(form);

            await Promise.all([
                queryClient.invalidateQueries({ queryKey: testExecutionsQueryKey(project.id) }),
                queryClient.invalidateQueries({ queryKey: testCasesQueryKey(project.id) }),
            ]);
            message.success(t('notifications.recordSuccess', { result: tTestCase(`result.${execution.status}`) }));
            // The recorded run's page: where its defect and attachments go.
            void navigate(`/projects/${project.id}/executions/${execution.id}`, FORM_EXIT_NAVIGATION);
        } catch (error) {
            // Deleted while the form was open: the API answers 400 on testCaseId.
            if (getApiErrorDetails(error).some((detail) => detail.field === 'testCaseId')) {
                message.error(t('notifications.testCaseGone'));
                void navigate(`/projects/${project.id}/test-cases`, FORM_EXIT_NAVIGATION);
                return;
            }

            console.error('Failed to record the ad hoc run:', error);
            message.error(t('notifications.recordError'));
        }
    };

    if (!isValidTestCaseId || getApiErrorCode(testCaseQuery.error) === API_ERROR_CODE.NOT_FOUND) {
        return <NotFoundState />;
    }

    if (testCaseQuery.isError) {
        return <QueryErrorState onRetry={() => void testCaseQuery.refetch()} />;
    }

    if (!testCaseQuery.data) {
        return <QueryLoadingState />;
    }

    const testCase = testCaseQuery.data;
    const steps: TestExecutionStepType[] = testCase.steps.map((step) => ({
        order: step.order,
        action: step.action,
        expectedResult: step.expectedResult,
        status: null,
        comment: '',
    }));

    return (
        <>
            <PageHeader title={t('page.executeTitle', { title: testCase.title })} />
            <ExecutionResultForm
                steps={steps}
                preConditions={testCase.preConditions}
                postConditions={testCase.postConditions}
                onSubmit={handleRun}
                onCancel={() => void navigate(testCasePath, FORM_EXIT_NAVIGATION)}
                isSubmitting={runMutation.isPending}
            />
        </>
    );
}
