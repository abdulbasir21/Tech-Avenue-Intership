import { Response } from 'express';

export interface ApiResponseBody<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  code?: string;
}

export function sendSuccess<T>(
  res: Response,
  statusCode: number,
  message: string,
  data: T,
): Response<ApiResponseBody<T>> {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}
