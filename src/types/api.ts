interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  pageSize: number;
}

export type { ApiResponse, PaginatedResponse };
