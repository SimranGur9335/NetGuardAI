import { Response } from 'express';
import { ApiResponse, ApiError } from '../models';

export function sendSuccess<T>(res: Response, data: T, statusCode = 200): void {
  const response: ApiResponse<T> = {
    success: true,
    data,
  };
  res.status(statusCode).json(response);
}

export function sendError(
  res: Response,
  code: string,
  message: string,
  statusCode = 400
): void {
  const response: ApiError = {
    success: false,
    error: {
      code,
      message,
    },
  };
  res.status(statusCode).json(response);
}
