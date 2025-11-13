/**
 * API related types
 */

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ApiMeta;
}

/**
 * API error structure
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * API metadata
 */
export interface ApiMeta {
  timestamp: string;
  requestId?: string;
  version?: string;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page: number;
  pageSize: number;
  total?: number;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationParams & {
    total: number;
    totalPages: number;
  };
}

/**
 * Sort parameters
 */
export interface SortParams {
  field: string;
  order: "asc" | "desc";
}

/**
 * Filter parameters
 */
export interface FilterParams {
  [key: string]: string | number | boolean | null | undefined;
}

/**
 * Query parameters combining pagination, sorting, and filtering
 */
export interface QueryParams {
  pagination?: Partial<PaginationParams>;
  sort?: SortParams;
  filters?: FilterParams;
}

/**
 * HTTP methods
 */
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/**
 * Request options
 */
export interface RequestOptions {
  method?: HttpMethod;
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean>;
  timeout?: number;
}
