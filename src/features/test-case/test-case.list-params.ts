import {
    EXECUTION_RESULTS,
    SORT_DIRECTIONS,
    TEST_CASE_SEARCH_MAX_LENGTH,
    TEST_CASE_PRIORITIES,
    TEST_CASE_SORT_FIELDS,
    TEST_TYPES,
} from './test-case.constant';
import type { TestCasePageRequestDto } from './test-case.request.dto';
import type { TestCaseListParamsType } from './test-case.type';
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '../../shared/constant/page.constant';

// The list's state lives in the URL (ui-requirements §4.3: shareable, survives refresh, back button works).
// The URL uses the API's own parameter names and comma-separated lists.
export const TEST_CASE_LIST_PARAM = {
    PAGE: 'page',
    PAGE_SIZE: 'pageSize',
    SEARCH: 'search',
    PRIORITY: 'priority',
    TYPE: 'type',
    TAGS: 'tags',
    SUITE_ID: 'suiteId',
    LAST_RESULT: 'lastResult',
    SORT: 'sort',
} as const;

function splitList(value: string | null): string[] {
    return value ? value.split(',').map((item) => item.trim()).filter(Boolean) : [];
}

// Values a hand-edited URL may contain but the API would reject (400) are dropped, not sent.
function pickKnown<TValue extends string>(value: string | null, known: readonly TValue[]): TValue[] {
    return splitList(value).filter((item): item is TValue => known.some((option) => option === item));
}

function toPositiveInteger(value: string | null): number | undefined {
    const number = Number(value);

    return value && Number.isInteger(number) && number > 0 ? number : undefined;
}

function parseSort(value: string | null): TestCaseListParamsType['sort'] {
    const [field, direction] = (value ?? '').split(':');
    const knownField = TEST_CASE_SORT_FIELDS.find((option) => option === field);
    const knownDirection = SORT_DIRECTIONS.find((option) => option === direction);

    return knownField && knownDirection ? { field: knownField, direction: knownDirection } : undefined;
}

export function parseTestCaseListParams(searchParams: URLSearchParams): TestCaseListParamsType {
    return {
        page: toPositiveInteger(searchParams.get(TEST_CASE_LIST_PARAM.PAGE)) ?? DEFAULT_PAGE,
        pageSize: toPositiveInteger(searchParams.get(TEST_CASE_LIST_PARAM.PAGE_SIZE)) ?? DEFAULT_PAGE_SIZE,
        search: (searchParams.get(TEST_CASE_LIST_PARAM.SEARCH) ?? '').trim().slice(0, TEST_CASE_SEARCH_MAX_LENGTH),
        priorities: pickKnown(searchParams.get(TEST_CASE_LIST_PARAM.PRIORITY), TEST_CASE_PRIORITIES),
        types: pickKnown(searchParams.get(TEST_CASE_LIST_PARAM.TYPE), TEST_TYPES),
        tags: splitList(searchParams.get(TEST_CASE_LIST_PARAM.TAGS)).map((tag) => tag.toLowerCase()),
        suiteId: toPositiveInteger(searchParams.get(TEST_CASE_LIST_PARAM.SUITE_ID)),
        lastResults: pickKnown(searchParams.get(TEST_CASE_LIST_PARAM.LAST_RESULT), EXECUTION_RESULTS),
        sort: parseSort(searchParams.get(TEST_CASE_LIST_PARAM.SORT)),
    };
}

const joinList = (values: string[]) => (values.length > 0 ? values.join(',') : undefined);

// Empty filters are left out of the request (and so out of the query key).
export function toTestCasePageRequestDto(params: TestCaseListParamsType): TestCasePageRequestDto {
    return {
        page: params.page,
        pageSize: params.pageSize,
        search: params.search || undefined,
        priority: joinList(params.priorities),
        type: joinList(params.types),
        tags: joinList(params.tags),
        suiteId: params.suiteId,
        lastResult: joinList(params.lastResults),
        sort: params.sort && `${params.sort.field}:${params.sort.direction}`,
    };
}

export type TestCaseListParamChanges = Partial<Omit<TestCaseListParamsType, 'page' | 'pageSize'>>;

// Writes changed filters/sort into the URL params (empty values removed). Any change goes back to page 1:
// the current page may not exist in the new result.
export function applyTestCaseListParamChanges(searchParams: URLSearchParams, changes: TestCaseListParamChanges): URLSearchParams {
    const set = (name: string, value: string | undefined) => {
        if (value) {
            searchParams.set(name, value);
        } else {
            searchParams.delete(name);
        }
    };

    if ('search' in changes) set(TEST_CASE_LIST_PARAM.SEARCH, changes.search);
    if ('priorities' in changes) set(TEST_CASE_LIST_PARAM.PRIORITY, joinList(changes.priorities ?? []));
    if ('types' in changes) set(TEST_CASE_LIST_PARAM.TYPE, joinList(changes.types ?? []));
    if ('tags' in changes) set(TEST_CASE_LIST_PARAM.TAGS, joinList(changes.tags ?? []));
    if ('suiteId' in changes) set(TEST_CASE_LIST_PARAM.SUITE_ID, changes.suiteId?.toString());
    if ('lastResults' in changes) set(TEST_CASE_LIST_PARAM.LAST_RESULT, joinList(changes.lastResults ?? []));
    if ('sort' in changes) set(TEST_CASE_LIST_PARAM.SORT, changes.sort && `${changes.sort.field}:${changes.sort.direction}`);

    searchParams.set(TEST_CASE_LIST_PARAM.PAGE, String(DEFAULT_PAGE));

    return searchParams;
}

// Any search or filter set (sorting and paging don't count) — e.g. to say "no matches" instead of "empty".
export function hasTestCaseFilters(params: TestCaseListParamChanges): boolean {
    return !!params.search || !!params.priorities?.length || !!params.types?.length || !!params.tags?.length
        || params.suiteId !== undefined || !!params.lastResults?.length;
}
