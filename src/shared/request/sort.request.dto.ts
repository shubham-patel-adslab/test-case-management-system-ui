import type { SortDirection } from '../type/sort.type';

// The `sort` query parameter, typed by the list's own fields (e.g. 'name:asc').
export type SortParam<TField extends string> = `${TField}:${SortDirection}`;
