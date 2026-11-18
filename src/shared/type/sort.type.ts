import type { SORT_DIRECTIONS } from '../constant/sort.constant';

export type SortDirection = (typeof SORT_DIRECTIONS)[number];

// A list's order: one of its sortable fields, and a direction.
export type ListSort<TField extends string> = {
    field: TField;
    direction: SortDirection;
};
