export type SortType = 'ASC' | 'DESC';
export interface PaginationRequest {
    limit?: number;
    offset?: number;
    sort?: SortType;
    sortBy?: string;
    query?: string;
}

