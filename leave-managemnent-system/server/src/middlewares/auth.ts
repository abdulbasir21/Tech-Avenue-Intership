import '../types/express';
import { NextFunction, Request, Response } from 'express';
import { UserRole, UserStatus } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';
import { verifyAccessToken } from '../utils/jwt';

function isAllowedDuringPasswordChange(req: Request): boolean {
  const cleanPath = req.originalUrl.split('?')[0].replace(/\/+$/, '');
  if (req.method === 'GET' && cleanPath === '/api/v1/auth/me') {
    return true;
  }
  if (req.method === 'POST' && cleanPath === '/api/v1/auth/change-password') {
    return true;
  }
  return false;
}

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(401, 'Authentication required');
    }

    const token = authHeader.slice('Bearer '.length).trim();
    if (!token) {
      throw new AppError(401, 'Authentication required');
    }

    const payload = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        mustChangePassword: true,
        employee: {
          select: {
            id: true,
            organizationId: true,
            departmentId: true,
            reportingManagerId: true,
            employeeCode: true,
            name: true,
          },
        },
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

    if (user.mustChangePassword && !isAllowedDuringPasswordChange(req)) {
      throw new AppError(
        403,
        'You must change your temporary password before accessing other resources',
        'MUST_CHANGE_PASSWORD',
      );
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

export function requirePermission(permissionKey: string) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      if (req.user.role === UserRole.ADMIN) {
        next();
        return;
      }

      const rolePermission = await prisma.rolePermission.findFirst({
        where: {
          role: req.user.role,
          permission: { key: permissionKey },
        },
        select: { id: true },
      });

      if (!rolePermission) {
        throw new AppError(403, 'You do not have permission to perform this action', 'FORBIDDEN');
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}
