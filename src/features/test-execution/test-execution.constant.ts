import type { TestExecutionSortField } from './test-execution.type';
import { EXECUTION_RESULTS } from '../test-case/test-case.constant';
import type { SortParam } from '../../shared/request/sort.request.dto';
import type { ListSort } from '../../shared/type/sort.type';

// PENDING = assigned (or part of a suite run), no result yet; a recorded result is one of EXECUTION_RESULTS.
export const EXECUTION_PENDING = 'PENDING';
export const EXECUTION_STATUSES = [EXECUTION_PENDING, ...EXECUTION_RESULTS] as const;

export const EXECUTION_AUDIT_ACTIONS = ['CREATED', 'RESULT_RECORDED', 'ATTACHMENT_ADDED', 'DEFECT_CREATED'] as const;

// Same limits as the backend's result schema.
export const EXECUTION_COMMENT_MAX_LENGTH = 5000;
export const EXECUTION_STEP_COMMENT_MAX_LENGTH = 2000;
// Assigning: 1–100 test cases per call — one list page at the largest page size.
export const EXECUTION_ASSIGN_MAX = 100;

// The execution queue's tabs (ui-requirements §4.4), kept in the URL.
export const EXECUTION_QUEUE_TAB = {
    MINE: 'mine',
    PENDING: 'pending',
    COMPLETED: 'completed',
} as const;

export const EXECUTION_HISTORY_PAGE_SIZE = 10;

// GET …/test-executions `sort` fields; test case title A→Z by default, like the API (ui-requirements §6.1
// "List order"). `executedAt` puts pending ones last both ways.
export const TEST_EXECUTION_SORT_FIELDS = ['testCaseTitle', 'createdAt', 'executedAt'] as const;
export const TEST_EXECUTION_DEFAULT_SORT: ListSort<TestExecutionSortField> = { field: 'testCaseTitle', direction: 'asc' };
// A test case's history: every row has the same title, so newest first.
export const TEST_EXECUTION_HISTORY_SORT = 'createdAt:desc' satisfies SortParam<TestExecutionSortField>;
