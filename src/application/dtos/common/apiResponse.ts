export interface ApiResponse<T> {
  ok: boolean;
  code: number;
  data?: T;
  message?: string;
  internal?: string;
}

export interface ApiErrorResponse {
  ok: boolean;
  code: number;
  message: string;
  internal?: string;
}
