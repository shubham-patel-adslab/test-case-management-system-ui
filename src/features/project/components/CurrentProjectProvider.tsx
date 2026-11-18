import { skipToken, useQuery } from '@tanstack/react-query';
import { useMatch } from 'react-router';

import { CurrentProjectContext } from '../current-project.context';
import { getProject } from '../project.api';
import { toProjectDetails } from '../project.mapper';
import { projectDetailsQueryKey } from '../project.query';

// Only a positive integer is a project id; /projects/create and /projects/abc are not inside a project.
function toProjectId(param: string | undefined): number | null {
    const value = Number(param);

    return Number.isInteger(value) && value > 0 ? value : null;
}

type CurrentProjectProviderProps = {
    children: React.ReactNode;
};

// Sits above the layout (the header and sidebar need the project too), so it reads the id with useMatch:
// route params of the child routes aren't visible up here.
export function CurrentProjectProvider({ children }: CurrentProjectProviderProps) {
    const match = useMatch('/projects/:projectId/*');
    const projectId = toProjectId(match?.params.projectId);

    const projectQuery = useQuery({
        queryKey: projectDetailsQueryKey(projectId),
        queryFn: projectId === null ? skipToken : ({ signal }) => getProject(projectId, signal),
        select: toProjectDetails,
    });

    return (
        <CurrentProjectContext value={{ projectId, projectQuery: projectId === null ? null : projectQuery }}>
            {children}
        </CurrentProjectContext>
    );
}
