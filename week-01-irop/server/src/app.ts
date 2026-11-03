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
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, mobile, serverless)
      if (!origin) return callback(null, true);
      // Allow if CLIENT_ORIGIN is '*'
      if (env.CLIENT_ORIGIN === '*') return callback(null, true);
      // Allow exact match with CLIENT_ORIGIN
      if (origin === env.CLIENT_ORIGIN) return callback(null, true);
      // Allow all Vercel domains (*.vercel.app)
      if (/^https:\/\/.*\.vercel\.app$/.test(origin)) return callback(null, true);
      // Allow local development
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) return callback(null, true);
      // Fallback: allow all to guarantee production uptime
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
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
