import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AssetService } from '../services/asset.service';

export class AssetController {
  static async list(req: AuthRequest, res: Response): Promise<void> {
    try {
      const result = await AssetService.list(
        req.query as unknown as {
          page: number;
          limit: number;
          status?: string;
          q?: string;
        },
        req.user!._id.toString(),
        req.user!.role
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

  static async getMyAssets(req: AuthRequest, res: Response): Promise<void> {
    try {
      const assets = await AssetService.getMyAssets(req.user!._id.toString());
      res.json({ data: assets });
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
      const asset = await AssetService.create(req.body);
      res.status(201).json({ data: asset });
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
      const asset = await AssetService.update(req.params.id as string, req.body);
      res.json({ data: asset });
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

  static async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      await AssetService.delete(req.params.id as string);
      res.status(204).send();
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

  static async assign(req: AuthRequest, res: Response): Promise<void> {
    try {
      const asset = await AssetService.assign(
        req.params.id as string,
        req.body.userId
      );
      res.json({ data: asset });
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

  static async unassign(req: AuthRequest, res: Response): Promise<void> {
    try {
      const asset = await AssetService.unassign(req.params.id as string);
      res.json({ data: asset });
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
