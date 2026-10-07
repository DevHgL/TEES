export interface PaginationParams {
  page: number;
  limit: number;
}

export interface Paginated<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
