import jwt, { SignOptions } from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import { env } from '../config/env';
import { AppError } from './AppError';

export interface AccessTokenPayload {
  sub: string;
  role: UserRole;
  type: 'access';
}

export interface RefreshTokenPayload {
  sub: string;
  type: 'refresh';
}

export interface ResetTokenPayload {
  sub: string;
  otpId: string;
  type: 'password_reset';
}

export function signAccessToken(userId: string, role: UserRole): string {
  const payload: AccessTokenPayload = {
    sub: userId,
    role,
    type: 'access',
  };
  const options: SignOptions = {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions['expiresIn'],
  };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, options);
}

export function signRefreshToken(userId: string, rememberMe: boolean): string {
  const payload: RefreshTokenPayload = {
    sub: userId,
    type: 'refresh',
  };
  const expiresIn = rememberMe
    ? env.JWT_REFRESH_REMEMBER_EXPIRES_IN
    : env.JWT_REFRESH_EXPIRES_IN;
  const options: SignOptions = {
    expiresIn: expiresIn as SignOptions['expiresIn'],
  };
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, options);
}

export function signResetToken(userId: string, otpId: string): string {
  const payload: ResetTokenPayload = {
    sub: userId,
    otpId,
    type: 'password_reset',
  };
  const options: SignOptions = {
    expiresIn: env.JWT_RESET_EXPIRES_IN as SignOptions['expiresIn'],
  };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, options);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as Partial<AccessTokenPayload>;
    if (!decoded.sub || decoded.type !== 'access' || !decoded.role) {
      throw new AppError(401, 'Invalid access token');
    }
    return decoded as AccessTokenPayload;
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(401, 'Invalid or expired access token');
  }
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as Partial<RefreshTokenPayload>;
    if (!decoded.sub || decoded.type !== 'refresh') {
      throw new AppError(401, 'Invalid refresh token');
    }
    return decoded as RefreshTokenPayload;
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(401, 'Invalid or expired refresh token');
  }
}

export function verifyResetToken(token: string): ResetTokenPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as Partial<ResetTokenPayload>;
    if (!decoded.sub || !decoded.otpId || decoded.type !== 'password_reset') {
      throw new AppError(401, 'Invalid password reset token');
    }
    return decoded as ResetTokenPayload;
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(401, 'Invalid or expired password reset token');
  }
}
