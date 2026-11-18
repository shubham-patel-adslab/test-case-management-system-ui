import type { TestCaseSortField } from './test-case.type';
import type { ListSort } from '../../shared/type/sort.type';

// UPPER_SNAKE_CASE on the wire, as the backend stores them (no mapping layer). Priority order is rank order.
export const TEST_CASE_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
export const TEST_TYPES = ['FUNCTIONAL', 'INTEGRATION', 'REGRESSION', 'SMOKE', 'UI', 'API'] as const;
// A recorded execution's result — a test case's lastResult is one of these (or null: never executed).
export const EXECUTION_RESULTS = ['PASS', 'FAIL', 'BLOCKED', 'SKIPPED'] as const;

// Same limits as the backend's test case schema.
export const TEST_CASE_TITLE_MAX_LENGTH = 255;
export const TEST_CASE_TEXT_MAX_LENGTH = 5000;
export const TEST_STEP_TEXT_MAX_LENGTH = 2000;
export const TEST_STEPS_MAX = 100;
export const TEST_CASE_TAGS_MAX = 20;
export const TEST_CASE_TAG_MAX_LENGTH = 50;
export const TEST_CASE_SUITES_MAX = 100;
export const TEST_CASE_SEARCH_MAX_LENGTH = 100;

// Bulk operations (POST …/test-cases/bulk): at most 100 test cases — one list page at the largest page size.
export const TEST_CASE_BULK_ACTION = {
    DELETE: 'DELETE',
    UPDATE_PRIORITY: 'UPDATE_PRIORITY',
    ASSIGN_TO_SUITE: 'ASSIGN_TO_SUITE',
} as const;
export const TEST_CASE_BULK_MAX = 100;

// GET …/test-cases `sort` fields; title A→Z by default, like the API (ui-requirements §6.1 "List order").
// The table has columns for title, priority, type and last executed.
export const TEST_CASE_SORT_FIELDS = ['title', 'priority', 'type', 'createdAt', 'updatedAt', 'lastExecutedAt'] as const;
export const TEST_CASE_DEFAULT_SORT: ListSort<TestCaseSortField> = { field: 'title', direction: 'asc' };

export const TEST_CASE_SEARCH_DEBOUNCE_MS = 300;

// Page sizes from here up render a virtualized table (PRD Features §7), which needs a fixed body height
// and a fixed total width: the columns' widths plus the row-selection column.
export const TEST_CASE_VIRTUAL_MIN_PAGE_SIZE = 50;
export const TEST_CASE_VIRTUAL_BODY_HEIGHT = 560;
export const TEST_CASE_TABLE_WIDTH = 1290;
