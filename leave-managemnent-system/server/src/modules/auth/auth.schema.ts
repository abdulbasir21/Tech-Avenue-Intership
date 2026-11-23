import { z } from 'zod';
import { passwordRuleSchema } from '../../utils/password';

export const loginSchema = z.object({
  email: z.string().trim().email('Valid email is required').transform((v) => v.toLowerCase()),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordRuleSchema,
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Valid email is required').transform((v) => v.toLowerCase()),
});

export const verifyOtpSchema = z.object({
  email: z.string().trim().email('Valid email is required').transform((v) => v.toLowerCase()),
  otp: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'OTP must be a 6-digit code'),
});

export const resetPasswordSchema = z.object({
  resetToken: z.string().min(1, 'Reset token is required'),
  newPassword: passwordRuleSchema,
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
