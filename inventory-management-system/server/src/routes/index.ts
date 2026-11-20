import { Router } from 'express';
import authRoutes from './auth.routes';
import metaRoutes from './meta.routes';
import userRoutes from './user.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/', metaRoutes);

export default router;
