import { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError';
import { env } from '../config/env';

interface BodyParserSyntaxError extends SyntaxError {
  status?: number;
  type?: string;
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): Response {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      data: err.data ?? null,
      ...(err.code ? { code: err.code } : {}),
    });
  }

  if (err instanceof ZodError) {
    const errors = err.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      data: { errors },
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const target = Array.isArray(err.meta?.target)
        ? (err.meta.target as string[]).join(', ')
        : 'unique field';
      return res.status(409).json({
        success: false,
        message: `Conflict: duplicate value for ${target}`,
        data: null,
      });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Requested resource was not found',
        data: null,
      });
    }
    if (err.code === 'P2003') {
      return res.status(400).json({
        success: false,
        message: 'Invalid foreign key reference',
        data: null,
      });
    }
  }

  if (
    err instanceof SyntaxError &&
    (err as BodyParserSyntaxError).type === 'entity.parse.failed'
  ) {
    return res.status(400).json({
      success: false,
      message: 'Malformed JSON request body',
      data: null,
    });
  }

  if (env.NODE_ENV !== 'test') {
    console.error('Unhandled error:', err);
  }

  return res.status(500).json({
    success: false,
    message: 'Internal server error',
    data: null,
  });
}
