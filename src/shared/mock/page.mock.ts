import { HttpResponse } from 'msw';

import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '../constant/page.constant';
import { SORT_DIRECTIONS, SORT_PARAM } from '../constant/sort.constant';
import type { ErrorDetailDto } from '../response/error.response.dto';
import type { PageResponseDto } from '../response/page.response.dto';
import type { ListSort } from '../type/sort.type';

// Shared by the feature mocks so every paginated list and validation error has the backend's envelope
// (ui-requirements §6.2).

export function getMockPaging(request: Request) {
    const url = new URL(request.url);

    return {
        url,
        page: Number(url.searchParams.get('page')) || DEFAULT_PAGE,
        pageSize: Number(url.searchParams.get('pageSize')) || DEFAULT_PAGE_SIZE,
    };
}

export function toMockPage<TItem>(items: TItem[], page: number, pageSize: number): PageResponseDto<TItem> {
    const startIndex = (page - 1) * pageSize;

    return {
        items: items.slice(startIndex, startIndex + pageSize),
        page,
        pageSize,
        totalItems: items.length,
        totalPages: Math.ceil(items.length / pageSize),
    };
}

export function mockValidationError(details: ErrorDetailDto[]) {
    return HttpResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Request validation failed', details } },
        { status: 400 },
    );
}

// The backend's `sort` param: `<field>:<asc|desc>` with one of the list's fields; the default when absent;
// anything else is a 400 on `sort`.
export function getMockSort<TField extends string>(
    url: URL,
    fields: readonly TField[],
    defaultSort: ListSort<TField>,
): { sort: ListSort<TField>; error?: never } | { sort?: never; error: Response } {
    const value = url.searchParams.get(SORT_PARAM);

    if (value === null) {
        return { sort: defaultSort };
    }

    const [field, direction, ...rest] = value.split(':');
    const knownField = fields.find((option) => option === field);
    const knownDirection = SORT_DIRECTIONS.find((option) => option === direction);

    if (!knownField || !knownDirection || rest.length > 0) {
        return {
            error: mockValidationError([{
                field: SORT_PARAM,
                message: `Must be <field>:<asc|desc>, field one of ${fields.join(', ')}`,
            }]),
        };
    }

    return { sort: { field: knownField, direction: knownDirection } };
}

// Like the database's en_US collation on lower(…): case-insensitive, spaces and punctuation ignored at first —
// so "Tester" comes before "Test lead" (a plain comparison puts the space first).
const mockTextCollator = new Intl.Collator('en', { sensitivity: 'base', ignorePunctuation: true });

export function compareMockText(a: string, b: string): number {
    return mockTextCollator.compare(a, b);
}

// The backend's ORDER BY <field> <direction>, <id> <direction>: ties broken by id in the same direction.
export function toMockSortComparator<TItem extends { id: number | string }, TField extends string>(
    sort: ListSort<TField>,
    compareBy: Record<TField, (a: TItem, b: TItem) => number>,
): (a: TItem, b: TItem) => number {
    const direction = sort.direction === 'asc' ? 1 : -1;
    const compareIds = (a: TItem, b: TItem) => (typeof a.id === 'number' && typeof b.id === 'number'
        ? a.id - b.id
        : String(a.id).localeCompare(String(b.id)));

    return (a, b) => direction * (compareBy[sort.field](a, b) || compareIds(a, b));
}

