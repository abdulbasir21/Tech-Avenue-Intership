import { Request, Response } from 'express';
import { z } from 'zod';
import { loginWithCredentials } from '../services/auth.service';
import { asyncHandler } from '../utils/asyncHandler';
import { COOKIE_NAME, getAuthCookieOptions, getClearCookieOptions } from '../utils/jwt';

const loginSchema = z.object({
  username: z.string().trim().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { username, password } = loginSchema.parse(req.body);
  const { token, user } = await loginWithCredentials(username, password);

  res.cookie(COOKIE_NAME, token, getAuthCookieOptions());
  res.status(200).json({
    success: true,
    data: { user },
  });
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  res.clearCookie(COOKIE_NAME, getClearCookieOptions());
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: { user: req.user },
  });
});
