import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { App, Typography } from 'antd';

import { ProjectForm } from '../components/ProjectForm';
import { createProject, getProject, updateProject } from '../project.api';
import {
    toProjectCreateRequestDto,
    toProjectDetails,
    toProjectFormValues,
    toProjectUpdateRequestDto,
} from '../project.mapper';
import type { ProjectFormType } from '../project.type';
import { QueryErrorState } from '../../../shared/components/QueryErrorState';
import { QueryLoadingState } from '../../../shared/components/QueryLoadingState';
import { useNumericRouteParam } from '../../../shared/hooks/useNumericRouteParam';

export function ProjectFormPage() {
    const navigate = useNavigate();

    const { t } = useTranslation('project');
    const { message } = App.useApp();
    const queryClient = useQueryClient();

    const { projectId } = useParams();

    const { value: projectID, isValid: isValidProjectID } = useNumericRouteParam(projectId);
    const isUpdateMode = projectID !== undefined;

    const projectQuery = useQuery({
        queryKey: ['projects', 'detail', projectID],
        queryFn: ({ signal }) => getProject(projectID!, signal),
        enabled: isUpdateMode && isValidProjectID,
    });

    const createProjectMutation = useMutation({
        mutationFn: createProject,
    });

    const updateProjectMutation = useMutation({
        mutationFn: updateProject,
    });

    const handleSubmit = async (data: ProjectFormType) => {
        try {
            const project = isUpdateMode
                ? await updateProjectMutation.mutateAsync(toProjectUpdateRequestDto({ id: projectID, ...data }))
                : await createProjectMutation.mutateAsync(toProjectCreateRequestDto(data));

            // One prefix covers every project list page and detail, so nothing shows stale data.
            await queryClient.invalidateQueries({ queryKey: ['projects'] });

            message.success(isUpdateMode ? t('notifications.updateSuccess') : t('notifications.createSuccess'));

            void navigate(`/projects/${project.id}`);
        } catch (error) {
            console.error('Failed to create/update project:', error);
            message.error(t('notifications.saveError'));
        }
    };

    if (projectId !== undefined && (!isValidProjectID || projectQuery.isError)) {
        return (
            <QueryErrorState onRetry={isValidProjectID ? () => void projectQuery.refetch() : undefined} />
        );
    }

    if (isUpdateMode && projectQuery.isLoading) {
        return <QueryLoadingState />;
    }

    const defaultValues: ProjectFormType | undefined = projectQuery.data
        ? toProjectFormValues(toProjectDetails(projectQuery.data))
        : undefined;

    const isSubmitting =
        createProjectMutation.isPending ||
        updateProjectMutation.isPending;

    return (
        <>
            <Typography.Title level={3}>
                {isUpdateMode ? t('page.updateTitle') : t('page.createTitle')}
            </Typography.Title>
            <ProjectForm onSubmit={handleSubmit} isSubmitting={isSubmitting} defaultValues={defaultValues} />
        </>
    );
}
