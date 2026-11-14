import type { PageResponseDto } from '../response/page.response.dto';
import type { PageType } from '../type/page.type';

export function toPageType<TDto, T>(
    dto: PageResponseDto<TDto>,
    mapItem: (item: TDto) => T
): PageType<T> {
    return {
        items: dto.items.map(mapItem),
        page: dto.page,
        pageSize: dto.pageSize,
        totalItems: dto.totalItems,
        totalPages: dto.totalPages,
    };
}
