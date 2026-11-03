import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import { env } from './config/env';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import leaveRoutes from './routes/leave.routes';
import assetRoutes from './routes/asset.routes';
import inventoryRoutes from './routes/inventory.routes';
import { errorHandler } from './middleware/errorHandler';

export const app = express();

// Security & Utility middleware
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      // In development or testing, allow all or client origin
      if (env.NODE_ENV !== 'production') return callback(null, true);
      if (origin === env.CLIENT_ORIGIN) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);
app.use(express.json());

if (env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Rate limiting on login endpoint
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many login attempts, please try again after 15 minutes',
      details: [],
    },
  },
});

// Root API status endpoint
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    name: 'IROP Backend API',
    status: 'online',
    health: '/health',
    version: '1.0.0',
  });
});

// Health check endpoint (no auth required)
app.get('/health', (_req: Request, res: Response) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  res.status(200).json({
    status: 'ok',
    db: isDbConnected ? 'connected' : 'disconnected',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/inventory', inventoryRoutes);

// 404 handler for unknown routes
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'Resource or endpoint not found',
      details: [],
    },
  });
});

// Global Error Handler
app.use(errorHandler);
