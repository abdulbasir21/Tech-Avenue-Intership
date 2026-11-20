import { Router } from 'express';
import {
  createUserHandler,
  deleteUserHandler,
  getUsers,
  updateUserHandler,
} from '../controllers/user.controller';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate, authorizeRoles('admin'));

router.get('/', getUsers);
router.post('/', createUserHandler);
router.patch('/:id', updateUserHandler);
router.delete('/:id', deleteUserHandler);

export default router;
