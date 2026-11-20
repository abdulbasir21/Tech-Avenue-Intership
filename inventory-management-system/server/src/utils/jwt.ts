import { CookieOptions } from 'express';
import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';

export const COOKIE_NAME = 'ims_token';

export interface AuthTokenPayload {
  sub: number;
  role: string;
}

export function signAuthToken(payload: AuthTokenPayload): string {
  const options: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  };
  return jwt.sign({ sub: payload.sub, role: payload.role }, env.JWT_SECRET, options);
}

export function verifyAuthToken(token: string): AuthTokenPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload | string;
  if (typeof decoded === 'string' || decoded === null) {
    throw new Error('Invalid token payload');
  }
  const userId = Number(decoded.sub);
  const role = typeof decoded.role === 'string' ? decoded.role : '';
  if (!Number.isInteger(userId) || userId <= 0 || !role) {
    throw new Error('Invalid token claims');
  }
  return { sub: userId, role };
}

export function parseDurationMs(expiresIn: string): number {
  const match = expiresIn.trim().match(/^(\d+)([smhd])$/i);
  if (!match) {
    return 24 * 60 * 60 * 1000;
  }
  const value = Number(match[1]);
  const unit = match[2].toLowerCase();
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  return value * (multipliers[unit] ?? 24 * 60 * 60 * 1000);
}

export function getAuthCookieOptions(): CookieOptions {
  const isProd = env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
    maxAge: parseDurationMs(env.JWT_EXPIRES_IN),
  };
}

export function getClearCookieOptions(): CookieOptions {
  const isProd = env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
  };
}
