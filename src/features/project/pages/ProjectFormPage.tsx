import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { App } from 'antd';

import { ProjectForm } from '../components/ProjectForm';
import { createProject, getProject, updateProject } from '../project.api';
import {
    toProjectCreateRequestDto,
    toProjectDetails,
    toProjectFormValues,
    toProjectUpdateRequestDto,
} from '../project.mapper';
import { projectDetailsQueryKey } from '../project.query';
import type { ProjectFormType, ProjectMemberType } from '../project.type';
import { useAuth } from '../../auth/auth.context';
import { PERMISSION_CODE, RESOURCE_CODE } from '../../auth/auth.constant';
import type { AuthSessionType } from '../../auth/auth.type';
import { API_ERROR_CODE, getApiErrorCode, getApiErrorDetails } from '../../../app/api-error';
import { FORM_EXIT_NAVIGATION } from '../../../shared/components/form/FormActions';
import { NotFoundState } from '../../../shared/components/NotFoundState';
import { PageHeader } from '../../../shared/components/PageHeader';
import { QueryErrorState } from '../../../shared/components/QueryErrorState';
import { QueryLoadingState } from '../../../shared/components/QueryLoadingState';
import { useNumericRouteParam } from '../../../shared/hooks/useNumericRouteParam';

// The signed-in user as a team member, for a new project's starting team.
function toSelfMember(session: AuthSessionType): ProjectMemberType {
    return { ...session.user, status: 'ACTIVE', role: session.role };
}

// A member picked in the form can't be added any more (e.g. deactivated meanwhile): 400 on memberIds[i].
function isMemberError(error: unknown): boolean {
    return getApiErrorCode(error) === API_ERROR_CODE.VALIDATION_ERROR
        && getApiErrorDetails(error).some((detail) => detail.field.startsWith('memberIds'));
}

export function ProjectFormPage() {
    const navigate = useNavigate();

    const { t } = useTranslation('project');
    const { message } = App.useApp();
    const queryClient = useQueryClient();
    const { session, can } = useAuth();

    const { projectId } = useParams();

    const { value: projectID, isValid: isValidProjectID } = useNumericRouteParam(projectId);
    const isUpdateMode = projectID !== undefined;

    const projectQuery = useQuery({
        queryKey: projectDetailsQueryKey(projectID),
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

            void navigate(`/projects/${project.id}`, FORM_EXIT_NAVIGATION);
        } catch (error) {
            if (isMemberError(error)) {
                message.error(t('notifications.memberUnavailable'));
                return;
            }

            console.error('Failed to create/update project:', error);
            message.error(t('notifications.saveError'));
        }
    };

    // Not found, or not one of the user's projects — the API answers 404 for both.
    if (getApiErrorCode(projectQuery.error) === API_ERROR_CODE.NOT_FOUND) {
        return <NotFoundState />;
    }

    if (projectId !== undefined && (!isValidProjectID || projectQuery.isError)) {
        return (
            <QueryErrorState onRetry={isValidProjectID ? () => void projectQuery.refetch() : undefined} />
        );
    }

    if (isUpdateMode && projectQuery.isLoading) {
        return <QueryLoadingState />;
    }

    const project = projectQuery.data ? toProjectDetails(projectQuery.data) : undefined;
    const defaultValues: ProjectFormType | undefined = project ? toProjectFormValues(project) : undefined;

    // Without the ALL_PROJECTS grant (everyone but admins) the user only reaches projects they're on, and
    // the API keeps them on the team — so they start on a new team and can't remove themselves. Same
    // permission the API checks: READ to see a created project, UPDATE to edit one.
    const isScopedToOwnProjects = !can(
        RESOURCE_CODE.ALL_PROJECTS,
        isUpdateMode ? PERMISSION_CODE.UPDATE : PERMISSION_CODE.READ,
    );
    const lockedMemberId = isScopedToOwnProjects ? session?.user.id : undefined;
    const initialMembers = project?.members ?? (isScopedToOwnProjects && session ? [toSelfMember(session)] : []);

    const isSubmitting =
        createProjectMutation.isPending ||
        updateProjectMutation.isPending;

    return (
        <>
            <PageHeader title={isUpdateMode ? t('page.updateTitle') : t('page.createTitle')} />
            <ProjectForm
                onSubmit={handleSubmit}
                // Back to where the user came from: the project for an update, the list for a create.
                onCancel={() => void navigate(isUpdateMode ? `/projects/${projectId}` : '/projects', FORM_EXIT_NAVIGATION)}
                isSubmitting={isSubmitting}
                defaultValues={defaultValues}
                initialMembers={initialMembers}
                lockedMemberId={lockedMemberId}
            />
        </>
    );
}
