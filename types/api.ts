export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

export interface ApiError {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
  timestamp: string;
}

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
