import type { PaginatedResponse } from '@/types/api';

/** Keep the existing UI page shape at the boundary of Spring Data pages. */
export function toPage<T>(wire: {
  content?: T[];
  number?: number;
  size?: number;
  totalElements?: number;
  totalPages?: number;
} | undefined): PaginatedResponse<T> {
  return {
    content: wire?.content ?? [],
    page: {
      number: wire?.number ?? 0,
      size: wire?.size ?? 0,
      totalElements: wire?.totalElements ?? 0,
      totalPages: wire?.totalPages ?? 0,
    },
  };
}
