import { Router } from 'express';
import authRoutes from './auth.routes';
import metaRoutes from './meta.routes';
import themeRoutes from './theme.routes';
import userRoutes from './user.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/theme', themeRoutes);
router.use('/', metaRoutes);

export default router;
