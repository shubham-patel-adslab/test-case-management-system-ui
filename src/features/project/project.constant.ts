import type { ProjectSortField } from './project.type';
import type { ListSort } from '../../shared/type/sort.type';

// UPPER_SNAKE_CASE on the wire, as the backend stores them (no mapping layer).
export const PROJECT_STATUSES = ['ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED'] as const;

export const PROJECT_NAME_MAX_LENGTH = 100;
export const PROJECT_VERSION_MAX_LENGTH = 20;
export const PROJECT_DESCRIPTION_MAX_LENGTH = 1000;
// Same limit as the backend's PROJECT_MEMBERS_MAX.
export const PROJECT_MEMBERS_MAX = 100;

// The member picker shows the first matches; typing narrows them down.
export const MEMBER_CANDIDATE_PAGE_SIZE = 20;
export const MEMBER_SEARCH_DEBOUNCE_MS = 300;

// Project pickers (header switcher, dashboard filter) list the first projects by name (the API's largest page;
// it has no search).
export const PROJECT_OPTIONS_PAGE_SIZE = 100;

// GET /projects `sort` fields; name A→Z by default, like the API (ui-requirements §6.1 "List order").
export const PROJECT_SORT_FIELDS = ['name', 'createdAt', 'updatedAt'] as const;
export const PROJECT_DEFAULT_SORT: ListSort<ProjectSortField> = { field: 'name', direction: 'asc' };
