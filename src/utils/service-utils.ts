import { SortType } from "../dto/generic/PaginationRequest";

export function sanitizeSortTypeString(sort: string): SortType {
   return sort === 'DESC' ? 'DESC' : 'ASC';
}

export function checkLegitSortByType<T>(type: readonly T[], sort: T): boolean {
   return type.indexOf(sort) >= 0;
}
