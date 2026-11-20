import '../types/express';
import { NextFunction, Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { COOKIE_NAME, getClearCookieOptions, verifyAuthToken } from '../utils/jwt';

export const authenticate = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token || typeof token !== 'string') {
    throw new AppError('Authentication required', 401);
  }

  let claims;
  try {
    claims = verifyAuthToken(token);
  } catch {
    res.clearCookie(COOKIE_NAME, getClearCookieOptions());
    throw new AppError('Invalid or expired session', 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: claims.sub },
    include: {
      role: true,
      employee: {
        include: {
          department: true,
        },
      },
    },
  });

  if (!user || !user.isActive || !user.employee.isActive) {
    res.clearCookie(COOKIE_NAME, getClearCookieOptions());
    throw new AppError('Session is no longer active', 401);
  }

  req.user = {
    id: user.id,
    employeeId: user.employeeId,
    username: user.username,
    fullName: user.employee.fullName,
    email: user.employee.email,
    role: user.role.code,
    roleName: user.role.name,
    department: user.employee.department.name,
    departmentId: user.employee.departmentId,
  };

  next();
});

export function authorizeRoles(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError('Authentication required', 401));
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(new AppError('Forbidden: you do not have permission to perform this action', 403));
      return;
    }
    next();
  };
}
