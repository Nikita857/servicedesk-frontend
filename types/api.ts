import type { ApiResponseVoid } from '@/lib/api/generated/models';

export type ApiResponse<T> = Omit<ApiResponseVoid, 'data'> & { data: T };

export interface PaginatedResponse<T> {
  content: T[];
  page: Page
}

export interface Page {
  size: number;
  number: number;
  totalElements: number;
  totalPages: number;
}
