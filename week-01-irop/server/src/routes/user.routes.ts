import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';
import { validate } from '../middleware/validate';
import {
  createUserSchema,
  updateUserSchema,
  resetPasswordSchema,
  listUsersQuerySchema,
} from '../validators/user.validator';

const router = Router();

// All user management routes require admin
router.use(requireAuth, requireRole('admin'));

router.get('/', validate(listUsersQuerySchema, 'query'), UserController.list);
router.post('/', validate(createUserSchema), UserController.create);
router.patch('/:id', validate(updateUserSchema), UserController.update);
router.post(
  '/:id/reset-password',
  validate(resetPasswordSchema),
  UserController.resetPassword
);

export default router;
