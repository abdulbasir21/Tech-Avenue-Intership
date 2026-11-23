import crypto from 'node:crypto';
import { UserStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/AppError';
import { comparePassword, hashPassword } from '../../utils/password';
import {
  signAccessToken,
  signRefreshToken,
  signResetToken,
  verifyRefreshToken,
  verifyResetToken,
} from '../../utils/jwt';
import { sendEmail } from '../../utils/email';
import {
  ChangePasswordInput,
  ForgotPasswordInput,
  LoginInput,
  RefreshTokenInput,
  ResetPasswordInput,
  VerifyOtpInput,
} from './auth.schema';

const OTP_EXPIRY_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 5;

export async function loginUser(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: {
      id: true,
      email: true,
      passwordHash: true,
      role: true,
      status: true,
      mustChangePassword: true,
      employee: {
        select: {
          id: true,
          name: true,
          employeeCode: true,
          departmentId: true,
        },
      },
    },
  });

  if (!user) {
    throw new AppError(401, 'Invalid email or password');
  }

  const isPasswordValid = await comparePassword(input.password, user.passwordHash);
  if (!isPasswordValid) {
    throw new AppError(401, 'Invalid email or password');
  }

  if (user.status === UserStatus.INACTIVE) {
    throw new AppError(
      403,
      'Your account is inactive. Please contact an administrator.',
      'ACCOUNT_INACTIVE',
    );
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const accessToken = signAccessToken(user.id, user.role);
  const refreshToken = signRefreshToken(user.id, input.rememberMe);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
      employee: user.employee,
    },
  };
}

export async function refreshAccessToken(input: RefreshTokenInput) {
  const payload = verifyRefreshToken(input.refreshToken);

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: {
      id: true,
      role: true,
      status: true,
    },
  });

  if (!user) {
    throw new AppError(401, 'User account not found');
  }

  if (user.status === UserStatus.INACTIVE) {
    throw new AppError(
      403,
      'Your account is inactive. Please contact an administrator.',
      'ACCOUNT_INACTIVE',
    );
  }

  const accessToken = signAccessToken(user.id, user.role);
  return { accessToken };
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      mustChangePassword: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
      preference: {
        select: {
          colorMode: true,
        },
      },
      employee: {
        select: {
          id: true,
          organizationId: true,
          departmentId: true,
          reportingManagerId: true,
          employeeCode: true,
          name: true,
          phone: true,
          designation: true,
          joinDate: true,
          department: {
            select: {
              id: true,
              name: true,
            },
          },
          reportingManager: {
            select: {
              id: true,
              name: true,
              employeeCode: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  return user;
}

export async function changePassword(userId: string, input: ChangePasswordInput) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, passwordHash: true },
  });

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  const isCurrentValid = await comparePassword(input.currentPassword, user.passwordHash);
  if (!isCurrentValid) {
    throw new AppError(400, 'Current password is incorrect');
  }

  const newPasswordHash = await hashPassword(input.newPassword);

  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash: newPasswordHash,
      mustChangePassword: false,
    },
  });
}

export async function requestPasswordResetOtp(input: ForgotPasswordInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: {
      id: true,
      email: true,
      status: true,
      employee: { select: { name: true } },
    },
  });

  if (!user || user.status === UserStatus.INACTIVE) {
    return;
  }

  const otp = crypto.randomInt(100000, 1000000).toString();
  const otpHash = await hashPassword(otp);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
  const now = new Date();

  await prisma.$transaction(
    async (tx) => {
      await tx.otpCode.updateMany({
        where: {
          userId: user.id,
          usedAt: null,
        },
        data: { usedAt: now },
      });

      await tx.otpCode.create({
        data: {
          userId: user.id,
          otpHash,
          expiresAt,
          attempts: 0,
        },
      });
    },
    { maxWait: 10000, timeout: 20000 },
  );

  const displayName = user.employee?.name ?? user.email;
  await sendEmail({
    to: user.email,
    subject: 'Password Reset Verification Code',
    text: `Hello ${displayName},\n\nYour password reset verification code is: ${otp}\n\nThis code will expire in ${OTP_EXPIRY_MINUTES} minutes. If you did not request a password reset, please ignore this message.`,
    html: `<p>Hello ${displayName},</p><p>Your password reset verification code is: <strong>${otp}</strong></p><p>This code will expire in ${OTP_EXPIRY_MINUTES} minutes.</p>`,
    event: 'PASSWORD_RESET_OTP',
    userId: user.id,
  });
}

export async function verifyPasswordResetOtp(input: VerifyOtpInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true, status: true },
  });

  if (!user || user.status === UserStatus.INACTIVE) {
    throw new AppError(400, 'Invalid or expired OTP code');
  }

  const otpRecord = await prisma.otpCode.findFirst({
    where: {
      userId: user.id,
      usedAt: null,
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!otpRecord) {
    throw new AppError(400, 'Invalid or expired OTP code');
  }

  if (otpRecord.expiresAt <= new Date()) {
    throw new AppError(400, 'OTP code has expired. Please request a new code.');
  }

  if (otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
    throw new AppError(
      400,
      'Maximum OTP verification attempts exceeded. Please request a new code.',
    );
  }

  const isOtpMatch = await comparePassword(input.otp, otpRecord.otpHash);
  if (!isOtpMatch) {
    const updated = await prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { attempts: { increment: 1 } },
      select: { attempts: true },
    });

    if (updated.attempts >= MAX_OTP_ATTEMPTS) {
      throw new AppError(
        400,
        'Maximum OTP verification attempts exceeded. Please request a new code.',
      );
    }

    throw new AppError(400, 'Invalid OTP code');
  }

  const consumed = await prisma.otpCode.updateMany({
    where: {
      id: otpRecord.id,
      usedAt: null,
    },
    data: {
      usedAt: new Date(),
    },
  });

  if (consumed.count !== 1) {
    throw new AppError(400, 'OTP code has already been used');
  }

  const resetToken = signResetToken(user.id, otpRecord.id);
  return { resetToken };
}

export async function resetPasswordWithToken(input: ResetPasswordInput) {
  const payload = verifyResetToken(input.resetToken);

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, status: true },
  });

  if (!user || user.status === UserStatus.INACTIVE) {
    throw new AppError(400, 'Invalid password reset request');
  }

  const otpRecord = await prisma.otpCode.findUnique({
    where: { id: payload.otpId },
    select: { id: true, userId: true, usedAt: true },
  });

  if (!otpRecord || otpRecord.userId !== user.id || !otpRecord.usedAt) {
    throw new AppError(400, 'Invalid password reset token');
  }

  const passwordHash = await hashPassword(input.newPassword);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      mustChangePassword: false,
    },
  });
}
