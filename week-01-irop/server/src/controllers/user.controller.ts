import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { UserService } from '../services/user.service';

export class UserController {
  static async list(req: AuthRequest, res: Response): Promise<void> {
    try {
      const result = await UserService.list(req.query as unknown as {
        page: number;
        limit: number;
        role?: string;
        department?: string;
        search?: string;
      });
      res.json(result);
    } catch (err) {
      const error = err as Error & { statusCode?: number; code?: string };
      res.status(error.statusCode || 500).json({
        error: {
          code: error.code || 'INTERNAL_ERROR',
          message: error.message,
          details: [],
        },
      });
    }
  }

  static async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const user = await UserService.create(req.body);
      res.status(201).json({ data: user.toJSON() });
    } catch (err) {
      const error = err as Error & { statusCode?: number; code?: string };
      res.status(error.statusCode || 500).json({
        error: {
          code: error.code || 'INTERNAL_ERROR',
          message: error.message,
          details: [],
        },
      });
    }
  }

  static async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const user = await UserService.update(
        req.params.id as string,
        req.body,
        req.user!._id.toString()
      );
      res.json({ data: user.toJSON() });
    } catch (err) {
      const error = err as Error & { statusCode?: number; code?: string };
      res.status(error.statusCode || 500).json({
        error: {
          code: error.code || 'INTERNAL_ERROR',
          message: error.message,
          details: [],
        },
      });
    }
  }

  static async resetPassword(req: AuthRequest, res: Response): Promise<void> {
    try {
      await UserService.resetPassword(req.params.id as string, req.body.newPassword);
      res.json({ message: 'Password reset successfully' });
    } catch (err) {
      const error = err as Error & { statusCode?: number; code?: string };
      res.status(error.statusCode || 500).json({
        error: {
          code: error.code || 'INTERNAL_ERROR',
          message: error.message,
          details: [],
        },
      });
    }
  }
}
