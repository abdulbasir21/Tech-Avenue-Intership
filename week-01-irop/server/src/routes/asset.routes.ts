import { Router } from 'express';
import { AssetController } from '../controllers/asset.controller';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';
import { validate } from '../middleware/validate';
import {
  createAssetSchema,
  updateAssetSchema,
  assignAssetSchema,
  listAssetsQuerySchema,
} from '../validators/asset.validator';

const router = Router();

// All asset routes require authentication
router.use(requireAuth);

router.get('/', validate(listAssetsQuerySchema, 'query'), AssetController.list);
router.get('/mine', AssetController.getMyAssets);

// Admin only routes
router.post(
  '/',
  requireRole('admin'),
  validate(createAssetSchema),
  AssetController.create
);
router.patch(
  '/:id',
  requireRole('admin'),
  validate(updateAssetSchema),
  AssetController.update
);
router.delete('/:id', requireRole('admin'), AssetController.delete);
router.patch(
  '/:id/assign',
  requireRole('admin'),
  validate(assignAssetSchema),
  AssetController.assign
);
router.patch('/:id/unassign', requireRole('admin'), AssetController.unassign);

export default router;
