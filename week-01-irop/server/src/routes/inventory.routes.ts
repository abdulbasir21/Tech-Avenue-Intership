import { Router } from 'express';
import { InventoryController } from '../controllers/inventory.controller';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';
import { validate } from '../middleware/validate';
import {
  createInventorySchema,
  updateInventorySchema,
  adjustInventorySchema,
  listInventoryQuerySchema,
} from '../validators/inventory.validator';

const router = Router();

// All inventory routes require auth and manager or admin role
router.use(requireAuth, requireRole('admin', 'manager'));

router.get(
  '/',
  validate(listInventoryQuerySchema, 'query'),
  InventoryController.list
);

// Admin only routes
router.post(
  '/',
  requireRole('admin'),
  validate(createInventorySchema),
  InventoryController.create
);
router.patch(
  '/:id',
  requireRole('admin'),
  validate(updateInventorySchema),
  InventoryController.update
);
router.delete('/:id', requireRole('admin'), InventoryController.delete);
router.patch(
  '/:id/adjust',
  requireRole('admin'),
  validate(adjustInventorySchema),
  InventoryController.adjust
);

export default router;
