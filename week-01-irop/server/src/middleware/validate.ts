import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export function validate(schema: ZodSchema, source: 'body' | 'query' = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const data = schema.parse(req[source]);
      if (source === 'body') {
        req.body = data;
      } else {
        Object.defineProperty(req, 'query', {
          value: data,
          writable: true,
          enumerable: true,
          configurable: true,
        });
      }
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const issues = err.issues || [];
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: issues.map((e) => ({
              path: Array.isArray(e.path) ? e.path.join('.') : String(e.path),
              message: e.message,
            })),
          },
        });
        return;
      }
      next(err);
    }
  };
}
