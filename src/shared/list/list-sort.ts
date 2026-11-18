import type { SorterResult, SortOrder } from 'antd/es/table/interface';

import { DEFAULT_PAGE } from '../constant/page.constant';
import { SORT_DIRECTIONS, SORT_PARAM } from '../constant/sort.constant';
import type { SortParam } from '../request/sort.request.dto';
import type { ListSort } from '../type/sort.type';

// Server-side list sorting (ui-requirements §6.1 "List order"): the order lives in the URL's `sort` param,
// which is left out — and not sent to the API — while it's the list's default (the API applies it then).
// So every order has one URL and one request, and the initial order is always the API's.

function isSameSort<TField extends string>(a: ListSort<TField>, b: ListSort<TField>): boolean {
    return a.field === b.field && a.direction === b.direction;
}

// The URL's sort, or the default when it's missing or not one this list knows (the API would answer 400).
export function parseListSort<TField extends string>(
    value: string | null,
    fields: readonly TField[],
    defaultSort: ListSort<TField>,
): ListSort<TField> {
    const [field, direction] = (value ?? '').split(':');
    const knownField = fields.find((option) => option === field);
    const knownDirection = SORT_DIRECTIONS.find((option) => option === direction);

    return knownField && knownDirection ? { field: knownField, direction: knownDirection } : defaultSort;
}

// The `sort` to send / keep in the URL: undefined for the default.
export function toSortParam<TField extends string>(sort: ListSort<TField>, defaultSort: ListSort<TField>): SortParam<TField> | undefined {
    return isSameSort(sort, defaultSort) ? undefined : `${sort.field}:${sort.direction}`;
}

// Writes the sort into the URL params. A new order starts at page 1: the current page shows other rows now.
export function setListSortParam<TField extends string>(
    searchParams: URLSearchParams,
    sort: ListSort<TField>,
    defaultSort: ListSort<TField>,
): URLSearchParams {
    const param = toSortParam(sort, defaultSort);

    if (param) {
        searchParams.set(SORT_PARAM, param);
    } else {
        searchParams.delete(SORT_PARAM);
    }

    searchParams.set('page', String(DEFAULT_PAGE));

    return searchParams;
}

// A column's controlled sort indicator: only the column the list is sorted by shows one.
export function toColumnSortOrder<TField extends string>(sort: ListSort<TField>, field: TField): SortOrder {
    if (sort.field !== field) {
        return null;
    }

    return sort.direction === 'asc' ? 'ascend' : 'descend';
}

// What a click on a column header asks for. Column keys are the API's field names; antd's third click clears
// the sort, which means the default again.
export function fromTableSorter<TRecord, TField extends string>(
    sorter: SorterResult<TRecord> | SorterResult<TRecord>[],
    fields: readonly TField[],
    defaultSort: ListSort<TField>,
): ListSort<TField> {
    const single = Array.isArray(sorter) ? sorter[0] : sorter;
    const field = fields.find((option) => option === single?.columnKey);

    if (!field || !single?.order) {
        return defaultSort;
    }

    return { field, direction: single.order === 'ascend' ? 'asc' : 'desc' };
}
