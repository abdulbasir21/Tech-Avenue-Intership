import { Router } from 'express';
import { getTheme, updateTheme } from '../controllers/theme.controller';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

router.get('/', getTheme);
router.put('/', authenticate, authorizeRoles('admin'), updateTheme);

export default router;
