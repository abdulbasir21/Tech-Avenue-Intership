import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/AppError';
import { CreateDepartmentInput, UpdateDepartmentInput } from './department.schema';

interface DepartmentRow {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    employees: number;
  };
}

function formatDepartment(dept: DepartmentRow) {
  return {
    id: dept.id,
    organizationId: dept.organizationId,
    name: dept.name,
    description: dept.description,
    employeeCount: dept._count.employees,
    createdAt: dept.createdAt,
    updatedAt: dept.updatedAt,
  };
}

export async function createDepartment(input: CreateDepartmentInput) {
  const organization = await prisma.organization.findFirst({
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });

  if (!organization) {
    throw new AppError(500, 'Organization is not configured');
  }

  const existing = await prisma.department.findFirst({
    where: {
      organizationId: organization.id,
      name: { equals: input.name, mode: 'insensitive' },
    },
    select: { id: true },
  });

  if (existing) {
    throw new AppError(409, `Department "${input.name}" already exists`);
  }

  const created = await prisma.department.create({
    data: {
      organizationId: organization.id,
      name: input.name,
      description: input.description ?? null,
    },
    include: {
      _count: {
        select: { employees: true },
      },
    },
  });

  return formatDepartment(created);
}

export async function listDepartments() {
  const departments = await prisma.department.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: { employees: true },
      },
    },
  });

  return departments.map(formatDepartment);
}

export async function getDepartmentById(id: string) {
  const department = await prisma.department.findUnique({
    where: { id },
    include: {
      _count: {
        select: { employees: true },
      },
    },
  });

  if (!department) {
    throw new AppError(404, 'Department not found');
  }

  return formatDepartment(department);
}

export async function updateDepartment(id: string, input: UpdateDepartmentInput) {
  const existing = await prisma.department.findUnique({
    where: { id },
    select: { id: true, organizationId: true, name: true },
  });

  if (!existing) {
    throw new AppError(404, 'Department not found');
  }

  if (input.name && input.name.toLowerCase() !== existing.name.toLowerCase()) {
    const duplicate = await prisma.department.findFirst({
      where: {
        organizationId: existing.organizationId,
        name: { equals: input.name, mode: 'insensitive' },
        id: { not: id },
      },
      select: { id: true },
    });
    if (duplicate) {
      throw new AppError(409, `Department "${input.name}" already exists`);
    }
  }

  const updated = await prisma.department.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
    },
    include: {
      _count: {
        select: { employees: true },
      },
    },
  });

  return formatDepartment(updated);
}

export async function deleteDepartment(id: string) {
  const department = await prisma.department.findUnique({
    where: { id },
    include: {
      _count: {
        select: { employees: true },
      },
    },
  });

  if (!department) {
    throw new AppError(404, 'Department not found');
  }

  if (department._count.employees > 0) {
    throw new AppError(
      409,
      `Cannot delete department "${department.name}" because it still has ${department._count.employees} assigned employee(s)`,
    );
  }

  await prisma.department.delete({
    where: { id },
  });
}
