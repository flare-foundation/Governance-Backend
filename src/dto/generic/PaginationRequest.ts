export type SortType = 'ASC' | 'DESC';
export interface PaginationRequest<SortBy> {
   limit?: number;
   offset?: number;
   sort?: SortType;
   sortBy?: SortBy;
   query?: string;
}
