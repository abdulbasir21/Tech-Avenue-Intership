import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { LeaveService } from '../services/leave.service';

export class LeaveController {
  static async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const leave = await LeaveService.create(req.user!._id.toString(), req.body);
      res.status(201).json({ data: leave });
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

  static async getMyLeaves(req: AuthRequest, res: Response): Promise<void> {
    try {
      const result = await LeaveService.getMyLeaves(
        req.user!._id.toString(),
        req.query as unknown as { page: number; limit: number; status?: string }
      );
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

  static async getBalance(req: AuthRequest, res: Response): Promise<void> {
    try {
      const balance = await LeaveService.getBalance(req.user!._id.toString());
      res.json({ data: balance });
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

  static async cancel(req: AuthRequest, res: Response): Promise<void> {
    try {
      const leave = await LeaveService.cancel(
        req.params.id as string,
        req.user!._id.toString()
      );
      res.json({ data: leave });
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

  static async getTeamLeaves(req: AuthRequest, res: Response): Promise<void> {
    try {
      const result = await LeaveService.getTeamLeaves(
        req.user!._id.toString(),
        req.user!.role,
        req.query as unknown as { page: number; limit: number; status?: string }
      );
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

  static async approve(req: AuthRequest, res: Response): Promise<void> {
    try {
      const leave = await LeaveService.approve(
        req.params.id as string,
        req.user!._id.toString(),
        req.body.reviewNote || ''
      );
      res.json({ data: leave });
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

  static async reject(req: AuthRequest, res: Response): Promise<void> {
    try {
      const leave = await LeaveService.reject(
        req.params.id as string,
        req.user!._id.toString(),
        req.body.reviewNote || ''
      );
      res.json({ data: leave });
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
