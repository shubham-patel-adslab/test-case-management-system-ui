import { skipToken, useQuery } from '@tanstack/react-query';

import { getProject, getProjects } from './project.api';
import { PROJECT_OPTIONS_PAGE_SIZE } from './project.constant';
import { projectDetailsQueryKey } from './project.query';
import type { ProjectDetailsResponseDto, ProjectPageResponseDto } from './project.response.dto';

export type ProjectOption = { value: number; label: string };

function toProjectOptions(page: ProjectPageResponseDto): ProjectOption[] {
    return page.items.map((project) => ({ value: project.id, label: project.name }));
}

function toProjectOption(project: ProjectDetailsResponseDto): ProjectOption {
    return { value: project.id, label: project.name };
}

// The user's projects as select options: the API's largest page, by name (its default order; it has no project
// search). A selected project beyond that page is added from its details, so a select shows its name, not its
// id; one that doesn't open (404) is left out. Used by the header's project switcher and the dashboard filter.
export function useProjectOptions(selectedProjectId: number | null) {
    const request = { page: 1, pageSize: PROJECT_OPTIONS_PAGE_SIZE };
    const listQuery = useQuery({
        queryKey: ['projects', 'list', request],
        queryFn: ({ signal }) => getProjects(request, signal),
        select: toProjectOptions,
    });

    const listed = listQuery.data ?? [];
    const isSelectedListed = listed.some((option) => option.value === selectedProjectId);
    // Same cache entry as the current project's details, so inside a project this is no extra request.
    const selectedQuery = useQuery({
        queryKey: projectDetailsQueryKey(selectedProjectId),
        queryFn: selectedProjectId === null || listQuery.isPending || isSelectedListed
            ? skipToken
            : ({ signal }) => getProject(selectedProjectId, signal),
        select: toProjectOption,
    });

    const selected = isSelectedListed ? undefined : selectedQuery.data;

    return {
        options: selected ? [selected, ...listed] : listed,
        isPending: listQuery.isPending,
        isError: listQuery.isError,
    };
}
