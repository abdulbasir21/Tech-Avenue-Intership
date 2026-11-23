import '../../types/express';
import { NextFunction, Request, Response } from 'express';
import { AppError } from '../../utils/AppError';
import { sendSuccess } from '../../utils/response';
import * as authService from './auth.service';
import {
  ChangePasswordInput,
  ForgotPasswordInput,
  LoginInput,
  RefreshTokenInput,
  ResetPasswordInput,
  VerifyOtpInput,
} from './auth.schema';

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await authService.loginUser(req.body as LoginInput);
    sendSuccess(res, 200, 'Login successful', result);
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await authService.refreshAccessToken(req.body as RefreshTokenInput);
    sendSuccess(res, 200, 'Access token refreshed successfully', result);
  } catch (err) {
    next(err);
  }
}

export async function me(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError(401, 'Authentication required');
    }
    const user = await authService.getCurrentUser(req.user.id);
    sendSuccess(res, 200, 'Current user profile fetched successfully', { user });
  } catch (err) {
    next(err);
  }
}

export async function changePassword(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError(401, 'Authentication required');
    }
    await authService.changePassword(req.user.id, req.body as ChangePasswordInput);
    sendSuccess(res, 200, 'Password changed successfully', null);
  } catch (err) {
    next(err);
  }
}

export async function forgotPassword(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await authService.requestPasswordResetOtp(req.body as ForgotPasswordInput);
    sendSuccess(
      res,
      200,
      'If an account with that email exists, a verification code has been sent.',
      null,
    );
  } catch (err) {
    next(err);
  }
}

export async function verifyOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await authService.verifyPasswordResetOtp(req.body as VerifyOtpInput);
    sendSuccess(res, 200, 'OTP verified successfully', result);
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await authService.resetPasswordWithToken(req.body as ResetPasswordInput);
    sendSuccess(res, 200, 'Password reset successfully', null);
  } catch (err) {
    next(err);
  }
}
