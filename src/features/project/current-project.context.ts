import { createContext, useContext } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';

import type { ProjectDetailsType } from './project.type';

// The project the user is working in (PRD Frontend Req §1: global state for the current project). The URL
// is the source (/projects/:projectId/…), so deep links and refreshes work; the context only mirrors it for
// the header switcher, the sidebar and every page inside the project.
export type CurrentProjectContextValue = {
    // null outside a project (and for a non-numeric id such as /projects/create).
    projectId: number | null;
    // The current project's details; null outside a project.
    projectQuery: UseQueryResult<ProjectDetailsType> | null;
};

export const CurrentProjectContext = createContext<CurrentProjectContextValue | null>(null);

export function useCurrentProjectContext(): CurrentProjectContextValue {
    // useContext rather than React 19's use(): the PRD (Frontend Req §1) evaluates useContext by name.
    const value = useContext(CurrentProjectContext);

    if (!value) {
        throw new Error('useCurrentProjectContext must be used inside CurrentProjectProvider');
    }

    return value;
}

// For pages inside ProjectWorkspaceLayout, which renders them only once the project has loaded.
export function useCurrentProject(): ProjectDetailsType {
    const { projectQuery } = useCurrentProjectContext();

    if (!projectQuery?.data) {
        throw new Error('useCurrentProject must be used inside ProjectWorkspaceLayout');
    }

    return projectQuery.data;
}
