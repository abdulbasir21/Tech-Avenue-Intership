import { Router } from 'express';
import { LeaveController } from '../controllers/leave.controller';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';
import { validate } from '../middleware/validate';
import {
  createLeaveSchema,
  reviewLeaveSchema,
  listLeavesQuerySchema,
} from '../validators/leave.validator';

const router = Router();

// All leave routes require authentication
router.use(requireAuth);

// Employee routes
router.post('/', validate(createLeaveSchema), LeaveController.create);
router.get(
  '/mine',
  validate(listLeavesQuerySchema, 'query'),
  LeaveController.getMyLeaves
);
router.get('/balance', LeaveController.getBalance);
router.patch('/:id/cancel', LeaveController.cancel);

// Manager/Admin routes
router.get(
  '/team',
  requireRole('manager', 'admin'),
  validate(listLeavesQuerySchema, 'query'),
  LeaveController.getTeamLeaves
);
router.patch(
  '/:id/approve',
  requireRole('manager', 'admin'),
  validate(reviewLeaveSchema),
  LeaveController.approve
);
router.patch(
  '/:id/reject',
  requireRole('manager', 'admin'),
  validate(reviewLeaveSchema),
  LeaveController.reject
);

export default router;
