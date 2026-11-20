import { Router } from 'express';
import { getDepartments, getRoles } from '../controllers/user.controller';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

router.get('/roles', authenticate, authorizeRoles('admin'), getRoles);
router.get('/departments', authenticate, authorizeRoles('admin'), getDepartments);

export default router;
