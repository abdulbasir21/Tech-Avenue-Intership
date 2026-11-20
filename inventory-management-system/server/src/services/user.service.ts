import crypto from 'crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';
import { hashPassword } from '../utils/password';

export interface UserDto {
  id: number;
  username: string;
  fullName: string;
  email: string | null;
  employeeCode: string;
  role: string;
  roleId: number;
  roleName: string;
  department: string;
  departmentId: number;
  isActive: boolean;
  createdAt: string;
}

type UserWithRelations = Prisma.UserGetPayload<{
  include: {
    role: true;
    employee: {
      include: {
        department: true;
      };
    };
  };
}>;

function toUserDto(user: UserWithRelations): UserDto {
  return {
    id: user.id,
    username: user.username,
    fullName: user.employee.fullName,
    email: user.employee.email,
    employeeCode: user.employee.employeeCode,
    role: user.role.code,
    roleId: user.role.id,
    roleName: user.role.name,
    department: user.employee.department.name,
    departmentId: user.employee.departmentId,
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString(),
  };
}

export async function listUsers(params: {
  search?: string;
  role?: string;
  status?: 'active' | 'inactive' | 'all';
  page: number;
  limit: number;
}): Promise<{
  users: UserDto[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}> {
  const { search, role, status, page, limit } = params;
  const where: Prisma.UserWhereInput = {};

  if (search && search.trim().length > 0) {
    const term = search.trim();
    where.OR = [
      { username: { contains: term, mode: 'insensitive' } },
      { employee: { fullName: { contains: term, mode: 'insensitive' } } },
      { employee: { email: { contains: term, mode: 'insensitive' } } },
    ];
  }

  if (role && role !== 'all') {
    where.role = { code: role };
  }

  if (status === 'active') {
    where.isActive = true;
  } else if (status === 'inactive') {
    where.isActive = false;
  }

  const skip = (page - 1) * limit;

  const rows = await prisma.user.findMany({
    where,
    include: {
      role: true,
      employee: {
        include: {
          department: true,
        },
      },
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    skip,
    take: limit,
  });
  const total = await prisma.user.count({ where });

  return {
    users: rows.map(toUserDto),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

export async function createUser(input: {
  fullName: string;
  email: string;
  username: string;
  password: string;
  roleId: number;
  departmentId: number;
}): Promise<UserDto> {
  const fieldErrors: Record<string, string> = {};

  const role = await prisma.role.findUnique({ where: { id: input.roleId } });
  const department = await prisma.department.findUnique({ where: { id: input.departmentId } });
  const existingUsername = await prisma.user.findFirst({
    where: { username: { equals: input.username, mode: 'insensitive' } },
    select: { id: true },
  });
  const existingEmail = await prisma.employee.findFirst({
    where: { email: { equals: input.email, mode: 'insensitive' } },
    select: { id: true },
  });

  if (!role) {
    fieldErrors.roleId = 'Invalid role selected';
  }
  if (!department || !department.isActive) {
    fieldErrors.departmentId = 'Invalid department selected';
  }
  if (Object.keys(fieldErrors).length > 0) {
    throw new AppError('Validation failed', 400, undefined, fieldErrors);
  }

  if (existingUsername) {
    throw new AppError('Username already exists', 409, undefined, {
      username: 'Username already exists',
    });
  }
  if (existingEmail) {
    throw new AppError('Email already exists', 409, undefined, {
      email: 'Email already exists',
    });
  }

  const passwordHash = await hashPassword(input.password);
  const employeeCode =
    'EMP-' +
    Date.now().toString(36).toUpperCase() +
    crypto.randomBytes(2).toString('hex').toUpperCase();

  const created = await prisma.$transaction(
    async (tx) => {
      const employee = await tx.employee.create({
        data: {
          employeeCode,
          fullName: input.fullName,
          email: input.email,
          departmentId: input.departmentId,
          isActive: true,
        },
      });

      return tx.user.create({
        data: {
          employeeId: employee.id,
          roleId: input.roleId,
          username: input.username,
          passwordHash,
          isActive: true,
        },
        include: {
          role: true,
          employee: {
            include: {
              department: true,
            },
          },
        },
      });
    },
    { maxWait: 10000, timeout: 15000 }
  );

  return toUserDto(created);
}

export async function updateUser(
  targetId: number,
  currentUserId: number,
  input: {
    fullName?: string;
    email?: string;
    username?: string;
    password?: string;
    roleId?: number;
    departmentId?: number;
    isActive?: boolean;
  }
): Promise<UserDto> {
  const existing = await prisma.user.findUnique({
    where: { id: targetId },
    include: {
      role: true,
      employee: true,
    },
  });

  if (!existing) {
    throw new AppError('User not found', 404);
  }

  if (existing.id === currentUserId) {
    if (input.isActive === false) {
      throw new AppError('You cannot deactivate your own account', 400, undefined, {
        isActive: 'You cannot deactivate your own account',
      });
    }
    if (input.roleId !== undefined && input.roleId !== existing.roleId) {
      const targetRole = await prisma.role.findUnique({ where: { id: input.roleId } });
      if (!targetRole || targetRole.code !== 'admin') {
        throw new AppError('You cannot demote your own admin account', 400, undefined, {
          roleId: 'You cannot demote your own admin account',
        });
      }
    }
  }

  const fieldErrors: Record<string, string> = {};
  if (input.roleId !== undefined) {
    const role = await prisma.role.findUnique({ where: { id: input.roleId } });
    if (!role) fieldErrors.roleId = 'Invalid role selected';
  }
  if (input.departmentId !== undefined) {
    const dept = await prisma.department.findUnique({ where: { id: input.departmentId } });
    if (!dept || !dept.isActive) fieldErrors.departmentId = 'Invalid department selected';
  }
  if (Object.keys(fieldErrors).length > 0) {
    throw new AppError('Validation failed', 400, undefined, fieldErrors);
  }

  if (input.username !== undefined) {
    const dupUser = await prisma.user.findFirst({
      where: {
        username: { equals: input.username, mode: 'insensitive' },
        NOT: { id: existing.id },
      },
      select: { id: true },
    });
    if (dupUser) {
      throw new AppError('Username already exists', 409, undefined, {
        username: 'Username already exists',
      });
    }
  }

  if (input.email !== undefined) {
    const dupEmail = await prisma.employee.findFirst({
      where: {
        email: { equals: input.email, mode: 'insensitive' },
        NOT: { id: existing.employeeId },
      },
      select: { id: true },
    });
    if (dupEmail) {
      throw new AppError('Email already exists', 409, undefined, {
        email: 'Email already exists',
      });
    }
  }

  const passwordHash =
    input.password && input.password.length > 0 ? await hashPassword(input.password) : undefined;

  const updated = await prisma.$transaction(
    async (tx) => {
      if (
        input.fullName !== undefined ||
        input.email !== undefined ||
        input.departmentId !== undefined
      ) {
        await tx.employee.update({
          where: { id: existing.employeeId },
          data: {
            ...(input.fullName !== undefined ? { fullName: input.fullName } : {}),
            ...(input.email !== undefined ? { email: input.email } : {}),
            ...(input.departmentId !== undefined ? { departmentId: input.departmentId } : {}),
          },
        });
      }

      return tx.user.update({
        where: { id: existing.id },
        data: {
          ...(input.username !== undefined ? { username: input.username } : {}),
          ...(input.roleId !== undefined ? { roleId: input.roleId } : {}),
          ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
          ...(passwordHash !== undefined ? { passwordHash } : {}),
        },
        include: {
          role: true,
          employee: {
            include: {
              department: true,
            },
          },
        },
      });
    },
    { maxWait: 10000, timeout: 15000 }
  );

  return toUserDto(updated);
}

export async function deleteUser(targetId: number, currentUserId: number): Promise<void> {
  if (targetId === currentUserId) {
    throw new AppError('You cannot delete your own account', 400);
  }

  const existing = await prisma.user.findUnique({
    where: { id: targetId },
    select: { id: true, employeeId: true },
  });

  if (!existing) {
    throw new AppError('User not found', 404);
  }

  try {
    await prisma.$transaction(
      async (tx) => {
        await tx.user.delete({ where: { id: existing.id } });
        await tx.employee.delete({ where: { id: existing.employeeId } });
      },
      { maxWait: 10000, timeout: 15000 }
    );
  } catch (err) {
    const isFkRestrict =
      (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') ||
      (err instanceof Error &&
        (err.message.includes('23001') ||
          err.message.includes('violates RESTRICT setting of foreign key constraint') ||
          err.message.includes('violates foreign key constraint')));

    if (isFkRestrict) {
      throw new AppError(
        'This user cannot be deleted because related history records exist. Please deactivate the account instead.',
        409,
        'DELETE_RESTRICTED'
      );
    }
    throw err;
  }
}

export async function listRoles() {
  return prisma.role.findMany({
    select: { id: true, code: true, name: true, description: true },
    orderBy: { id: 'asc' },
  });
}

export async function listDepartments() {
  return prisma.department.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });
}
