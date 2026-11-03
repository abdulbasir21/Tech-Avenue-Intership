import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { InventoryService } from '../services/inventory.service';

export class InventoryController {
  static async list(req: AuthRequest, res: Response): Promise<void> {
    try {
      const result = await InventoryService.list(
        req.query as unknown as { page: number; limit: number }
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

  static async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const item = await InventoryService.create(req.body);
      res.status(201).json({ data: item });
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
      const item = await InventoryService.update(
        req.params.id as string,
        req.body
      );
      res.json({ data: item });
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
      await InventoryService.delete(req.params.id as string);
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

  static async adjust(req: AuthRequest, res: Response): Promise<void> {
    try {
      const item = await InventoryService.adjust(
        req.params.id as string,
        req.body.delta
      );
      res.json({ data: item });
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
