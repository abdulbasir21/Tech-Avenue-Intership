import { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.code ? { code: err.code } : {}),
      ...(err.errors ? { errors: err.errors } : {}),
    });
    return;
  }

  if (err instanceof ZodError) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of err.issues) {
      const key = issue.path.join('.') || 'form';
      if (!fieldErrors[key]) {
        fieldErrors[key] = issue.message;
      }
    }
    const firstMessage = err.issues[0]?.message || 'Validation failed';
    res.status(400).json({
      success: false,
      message: firstMessage,
      errors: fieldErrors,
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      res.status(409).json({
        success: false,
        message: 'A record with that unique value already exists',
      });
      return;
    }
    if (err.code === 'P2003') {
      res.status(409).json({
        success: false,
        code: 'DELETE_RESTRICTED',
        message:
          'This record cannot be deleted because related history records exist. Please deactivate it instead.',
      });
      return;
    }
    if (err.code === 'P2025') {
      res.status(404).json({
        success: false,
        message: 'Record not found',
      });
      return;
    }
  }

  if (
    err instanceof Error &&
    (err.message.includes('23001') ||
      err.message.includes('violates RESTRICT setting of foreign key constraint'))
  ) {
    res.status(409).json({
      success: false,
      code: 'DELETE_RESTRICTED',
      message:
        'This record cannot be deleted because related history records exist. Please deactivate it instead.',
    });
    return;
  }

  console.error('Unhandled server error:', err instanceof Error ? err.message : 'Unknown error');
  res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
}
