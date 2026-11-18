import { describe, expect, it } from 'vitest';

import { fromTableSorter, parseListSort, setListSortParam, toColumnSortOrder, toSortParam } from './list-sort';
import type { ListSort } from '../type/sort.type';

const FIELDS = ['name', 'createdAt'] as const;
type Field = (typeof FIELDS)[number];
const DEFAULT_SORT: ListSort<Field> = { field: 'name', direction: 'asc' };

describe('list sort', () => {
    it('reads the URL sort, and falls back to the API default when missing or unknown', () => {
        expect(parseListSort('createdAt:desc', FIELDS, DEFAULT_SORT)).toEqual({ field: 'createdAt', direction: 'desc' });
        expect(parseListSort(null, FIELDS, DEFAULT_SORT)).toEqual(DEFAULT_SORT);
        expect(parseListSort('email:asc', FIELDS, DEFAULT_SORT)).toEqual(DEFAULT_SORT);
        expect(parseListSort('name:up', FIELDS, DEFAULT_SORT)).toEqual(DEFAULT_SORT);
    });

    it('never sends or stores the default, so each order has one URL and one request', () => {
        expect(toSortParam(DEFAULT_SORT, DEFAULT_SORT)).toBeUndefined();
        expect(toSortParam({ field: 'name', direction: 'desc' }, DEFAULT_SORT)).toBe('name:desc');

        const params = setListSortParam(new URLSearchParams('page=3&sort=createdAt:asc'), DEFAULT_SORT, DEFAULT_SORT);

        expect(params.has('sort')).toBe(false);
    });

    it('goes back to page 1 when the order changes', () => {
        const params = setListSortParam(new URLSearchParams('page=3'), { field: 'createdAt', direction: 'desc' }, DEFAULT_SORT);

        expect(params.get('sort')).toBe('createdAt:desc');
        expect(params.get('page')).toBe('1');
    });

    it('maps a column header click to the sort, and a cleared header to the default', () => {
        expect(fromTableSorter({ columnKey: 'createdAt', order: 'descend' }, FIELDS, DEFAULT_SORT)).toEqual({ field: 'createdAt', direction: 'desc' });
        expect(fromTableSorter({ columnKey: 'createdAt', order: undefined }, FIELDS, DEFAULT_SORT)).toEqual(DEFAULT_SORT);
        expect(fromTableSorter({ columnKey: 'status', order: 'ascend' }, FIELDS, DEFAULT_SORT)).toEqual(DEFAULT_SORT);
    });

    it('shows the indicator only on the sorted column', () => {
        expect(toColumnSortOrder(DEFAULT_SORT, 'name')).toBe('ascend');
        expect(toColumnSortOrder(DEFAULT_SORT, 'createdAt')).toBeNull();
    });
});
