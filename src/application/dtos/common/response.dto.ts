export interface ApiResponse<T> {
  ok: boolean;
  code: number;
  data?: T;
  message?: string;
}

export interface ApiErrorResponse<T> extends ApiResponse<T> {
  stack?: string;
}
