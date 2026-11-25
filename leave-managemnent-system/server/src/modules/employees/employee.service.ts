import { ColorMode, Prisma, UserRole, UserStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/AppError';
import { hashPassword } from '../../utils/password';
import {
  CreateEmployeeInput,
  ListEmployeesQuery,
  ResetEmployeePasswordInput,
  UpdateEmployeeInput,
  UpdateEmployeeStatusInput,
} from './employee.schema';

const employeeSelect = {
  id: true,
  userId: true,
  organizationId: true,
  departmentId: true,
  reportingManagerId: true,
  employeeCode: true,
  name: true,
  phone: true,
  designation: true,
  joinDate: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: {
      email: true,
      role: true,
      status: true,
      mustChangePassword: true,
      lastLoginAt: true,
    },
  },
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
} satisfies Prisma.EmployeeSelect;

type EmployeeWithRelations = Prisma.EmployeeGetPayload<{ select: typeof employeeSelect }>;

function formatEmployee(emp: EmployeeWithRelations) {
  return {
    id: emp.id,
    userId: emp.userId,
    organizationId: emp.organizationId,
    departmentId: emp.departmentId,
    reportingManagerId: emp.reportingManagerId,
    employeeCode: emp.employeeCode,
    name: emp.name,
    phone: emp.phone,
    designation: emp.designation,
    joinDate: emp.joinDate ? emp.joinDate.toISOString().slice(0, 10) : null,
    email: emp.user.email,
    role: emp.user.role,
    status: emp.user.status,
    mustChangePassword: emp.user.mustChangePassword,
    lastLoginAt: emp.user.lastLoginAt,
    department: emp.department,
    reportingManager: emp.reportingManager,
    createdAt: emp.createdAt,
    updatedAt: emp.updatedAt,
  };
}

async function generateNextEmployeeCode(tx: Prisma.TransactionClient): Promise<string> {
  const existing = await tx.employee.findMany({
    select: { employeeCode: true },
  });

  let maxNum = 0;
  for (const row of existing) {
    const match = /^EMP-(\d+)$/i.exec(row.employeeCode);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) {
        maxNum = num;
      }
    }
  }

  return `EMP-${String(maxNum + 1).padStart(4, '0')}`;
}

async function validateReportingManager(
  reportingManagerId: string,
  selfEmployeeId?: string,
): Promise<void> {
  if (selfEmployeeId && reportingManagerId === selfEmployeeId) {
    throw new AppError(400, 'An employee cannot be their own reporting manager');
  }

  const manager = await prisma.employee.findUnique({
    where: { id: reportingManagerId },
    select: {
      id: true,
      user: {
        select: {
          role: true,
          status: true,
        },
      },
    },
  });

  if (!manager) {
    throw new AppError(404, 'Reporting manager not found');
  }

  if (manager.user.status !== UserStatus.ACTIVE) {
    throw new AppError(400, 'Reporting manager must be an ACTIVE employee');
  }

  if (manager.user.role !== UserRole.MANAGER && manager.user.role !== UserRole.ADMIN) {
    throw new AppError(400, 'Reporting manager must have MANAGER or ADMIN role');
  }
}

export async function createEmployee(input: CreateEmployeeInput) {
  if (input.role === UserRole.ADMIN && input.reportingManagerId) {
    throw new AppError(400, 'An ADMIN employee cannot have a reporting manager');
  }

  const [existingEmail, organization] = await Promise.all([
    prisma.user.findUnique({
      where: { email: input.email },
      select: { id: true },
    }),
    prisma.organization.findFirst({
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    }),
  ]);

  if (existingEmail) {
    throw new AppError(409, 'An employee with this email already exists');
  }

  if (!organization) {
    throw new AppError(500, 'Organization is not configured');
  }

  if (input.departmentId) {
    const department = await prisma.department.findUnique({
      where: { id: input.departmentId },
      select: { id: true, organizationId: true },
    });
    if (!department || department.organizationId !== organization.id) {
      throw new AppError(404, 'Department not found');
    }
  }

  if (input.reportingManagerId) {
    await validateReportingManager(input.reportingManagerId);
  }

  if (input.employeeCode) {
    const existingCode = await prisma.employee.findUnique({
      where: { employeeCode: input.employeeCode },
      select: { id: true },
    });
    if (existingCode) {
      throw new AppError(409, 'An employee with this employee code already exists');
    }
  }

  const passwordHash = await hashPassword(input.temporaryPassword);

  const created = await prisma.$transaction(
    async (tx) => {
      const employeeCode = input.employeeCode ?? (await generateNextEmployeeCode(tx));

      const user = await tx.user.create({
        data: {
          email: input.email,
          passwordHash,
          role: input.role,
          status: UserStatus.ACTIVE,
          mustChangePassword: true,
        },
      });

      const employee = await tx.employee.create({
        data: {
          userId: user.id,
          organizationId: organization.id,
          departmentId: input.departmentId ?? null,
          reportingManagerId:
            input.role === UserRole.ADMIN ? null : (input.reportingManagerId ?? null),
          employeeCode,
          name: input.name,
          phone: input.phone ?? null,
          designation: input.designation ?? null,
          joinDate: input.joinDate ? new Date(`${input.joinDate}T00:00:00.000Z`) : null,
        },
        select: employeeSelect,
      });

      await tx.userPreference.create({
        data: {
          userId: user.id,
          colorMode: ColorMode.LIGHT,
        },
      });

      return employee;
    },
    { maxWait: 10000, timeout: 20000 },
  );

  return formatEmployee(created);
}

export async function listEmployees(query: ListEmployeesQuery) {
  const { search, departmentId, role, status, reportingManagerId, page, limit, sortBy, sortOrder } =
    query;

  const userWhere: Prisma.UserWhereInput = {};
  if (role) userWhere.role = role;
  if (status) userWhere.status = status;

  const where: Prisma.EmployeeWhereInput = {};
  if (departmentId) where.departmentId = departmentId;
  if (reportingManagerId) where.reportingManagerId = reportingManagerId;
  if (Object.keys(userWhere).length > 0) {
    where.user = userWhere;
  }

  if (search && search.length > 0) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { employeeCode: { contains: search, mode: 'insensitive' } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
    ];
  }

  let orderBy: Prisma.EmployeeOrderByWithRelationInput;
  if (sortBy === 'email' || sortBy === 'role' || sortBy === 'status') {
    orderBy = { user: { [sortBy]: sortOrder } };
  } else {
    orderBy = { [sortBy]: sortOrder };
  }

  const skip = (page - 1) * limit;

  const [total, rows] = await Promise.all([
    prisma.employee.count({ where }),
    prisma.employee.findMany({
      where,
      select: employeeSelect,
      orderBy,
      skip,
      take: limit,
    }),
  ]);

  return {
    items: rows.map(formatEmployee),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

export async function getEmployeeById(id: string) {
  const employee = await prisma.employee.findUnique({
    where: { id },
    select: employeeSelect,
  });

  if (!employee) {
    throw new AppError(404, 'Employee not found');
  }

  return formatEmployee(employee);
}

export async function updateEmployee(id: string, input: UpdateEmployeeInput) {
  const existing = await prisma.employee.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      organizationId: true,
      employeeCode: true,
      reportingManagerId: true,
      user: { select: { role: true, email: true } },
    },
  });

  if (!existing) {
    throw new AppError(404, 'Employee not found');
  }

  const nextRole = input.role ?? existing.user.role;

  if (nextRole === UserRole.ADMIN && input.reportingManagerId) {
    throw new AppError(400, 'An ADMIN employee cannot have a reporting manager');
  }

  let nextReportingManagerId: string | null | undefined = undefined;
  if (nextRole === UserRole.ADMIN) {
    nextReportingManagerId = null;
  } else if (input.reportingManagerId !== undefined) {
    if (input.reportingManagerId !== null) {
      await validateReportingManager(input.reportingManagerId, existing.id);
    }
    nextReportingManagerId = input.reportingManagerId;
  }

  if (input.departmentId !== undefined && input.departmentId !== null) {
    const department = await prisma.department.findUnique({
      where: { id: input.departmentId },
      select: { id: true, organizationId: true },
    });
    if (!department || department.organizationId !== existing.organizationId) {
      throw new AppError(404, 'Department not found');
    }
  }

  if (input.email !== undefined && input.email !== existing.user.email) {
    const duplicateEmail = await prisma.user.findUnique({
      where: { email: input.email },
      select: { id: true },
    });
    if (duplicateEmail) {
      throw new AppError(409, 'An employee with this email already exists');
    }
  }

  if (input.employeeCode !== undefined && input.employeeCode !== existing.employeeCode) {
    const duplicateCode = await prisma.employee.findUnique({
      where: { employeeCode: input.employeeCode },
      select: { id: true },
    });
    if (duplicateCode) {
      throw new AppError(409, 'An employee with this employee code already exists');
    }
  }

  const updated = await prisma.$transaction(
    async (tx) => {
      const userUpdate: Prisma.UserUpdateInput = {};
      if (input.role && input.role !== existing.user.role) {
        userUpdate.role = input.role;
      }
      if (input.email !== undefined && input.email !== existing.user.email) {
        userUpdate.email = input.email;
      }
      if (Object.keys(userUpdate).length > 0) {
        await tx.user.update({
          where: { id: existing.userId },
          data: userUpdate,
        });
      }

      const employeeData: Prisma.EmployeeUncheckedUpdateInput = {};
      if (input.name !== undefined) employeeData.name = input.name;
      if (input.phone !== undefined) employeeData.phone = input.phone;
      if (input.designation !== undefined) employeeData.designation = input.designation;
      if (input.departmentId !== undefined) employeeData.departmentId = input.departmentId;
      if (nextReportingManagerId !== undefined) {
        employeeData.reportingManagerId = nextReportingManagerId;
      }
      if (input.joinDate !== undefined) {
        employeeData.joinDate = input.joinDate
          ? new Date(`${input.joinDate}T00:00:00.000Z`)
          : null;
      }
      if (input.employeeCode !== undefined) employeeData.employeeCode = input.employeeCode;

      return tx.employee.update({
        where: { id },
        data: employeeData,
        select: employeeSelect,
      });
    },
    { maxWait: 10000, timeout: 20000 },
  );

  return formatEmployee(updated);
}

export async function updateEmployeeStatus(
  id: string,
  input: UpdateEmployeeStatusInput,
  actorUserId: string,
) {
  const existing = await prisma.employee.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
    },
  });

  if (!existing) {
    throw new AppError(404, 'Employee not found');
  }

  if (existing.userId === actorUserId && input.status === UserStatus.INACTIVE) {
    throw new AppError(400, 'You cannot deactivate your own account');
  }

  await prisma.user.update({
    where: { id: existing.userId },
    data: { status: input.status },
  });

  const refreshed = await prisma.employee.findUnique({
    where: { id },
    select: employeeSelect,
  });

  if (!refreshed) {
    throw new AppError(404, 'Employee not found');
  }

  return formatEmployee(refreshed);
}

export async function resetEmployeePassword(id: string, input: ResetEmployeePasswordInput) {
  const existing = await prisma.employee.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
    },
  });

  if (!existing) {
    throw new AppError(404, 'Employee not found');
  }

  const passwordHash = await hashPassword(input.temporaryPassword);

  await prisma.user.update({
    where: { id: existing.userId },
    data: {
      passwordHash,
      mustChangePassword: true,
    },
  });

  return {
    employeeId: existing.id,
    userId: existing.userId,
    mustChangePassword: true,
  };
}
