import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { User, IUser } from '../models';

export interface AuthRequest extends Request {
  user?: IUser;
}

interface JwtPayload {
  id: string;
  role: string;
}

export async function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'No token provided', details: [] },
      });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    const user = await User.findById(decoded.id).select('+passwordHash');
    if (!user) {
      res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'User not found', details: [] },
      });
      return;
    }

    if (!user.isActive) {
      res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'Account is deactivated', details: [] },
      });
      return;
    }

    req.user = user;
    next();
  } catch {
    res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token', details: [] },
    });
  }
}
