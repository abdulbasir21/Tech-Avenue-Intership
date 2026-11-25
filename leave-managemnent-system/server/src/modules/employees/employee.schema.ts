import { UserRole, UserStatus } from '@prisma/client';
import { z } from 'zod';
import { passwordRuleSchema } from '../../utils/password';

const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const employeeIdParamSchema = z.object({
  id: z.string().uuid('Invalid employee ID format'),
});

export const createEmployeeSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(255),
  email: z
    .string()
    .trim()
    .email('Valid email is required')
    .max(255)
    .transform((v) => v.toLowerCase()),
  phone: z.string().trim().max(50).optional().nullable(),
  designation: z.string().trim().max(255).optional().nullable(),
  departmentId: z.string().uuid('Invalid department ID').optional().nullable(),
  reportingManagerId: z.string().uuid('Invalid reporting manager ID').optional().nullable(),
  joinDate: z
    .string()
    .trim()
    .regex(isoDateRegex, 'joinDate must be in YYYY-MM-DD format')
    .optional()
    .nullable(),
  role: z.nativeEnum(UserRole),
  temporaryPassword: passwordRuleSchema,
  employeeCode: z.string().trim().min(2).max(50).optional(),
});

export const updateEmployeeSchema = z
  .object({
    name: z.string().trim().min(2).max(255).optional(),
    email: z
      .string()
      .trim()
      .email('Valid email is required')
      .max(255)
      .transform((v) => v.toLowerCase())
      .optional(),
    phone: z.string().trim().max(50).optional().nullable(),
    designation: z.string().trim().max(255).optional().nullable(),
    departmentId: z.string().uuid('Invalid department ID').optional().nullable(),
    reportingManagerId: z.string().uuid('Invalid reporting manager ID').optional().nullable(),
    joinDate: z
      .string()
      .trim()
      .regex(isoDateRegex, 'joinDate must be in YYYY-MM-DD format')
      .optional()
      .nullable(),
    role: z.nativeEnum(UserRole).optional(),
    employeeCode: z.string().trim().min(2).max(50).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

export const updateEmployeeStatusSchema = z.object({
  status: z.nativeEnum(UserStatus),
});

export const resetEmployeePasswordSchema = z.object({
  temporaryPassword: passwordRuleSchema,
});

export const listEmployeesQuerySchema = z.object({
  search: z.string().trim().optional(),
  departmentId: z.string().uuid('Invalid department ID').optional(),
  role: z.nativeEnum(UserRole).optional(),
  status: z.nativeEnum(UserStatus).optional(),
  reportingManagerId: z.string().uuid('Invalid reporting manager ID').optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z
    .enum(['name', 'employeeCode', 'joinDate', 'createdAt', 'email', 'role', 'status'])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
export type UpdateEmployeeStatusInput = z.infer<typeof updateEmployeeStatusSchema>;
export type ResetEmployeePasswordInput = z.infer<typeof resetEmployeePasswordSchema>;
export type ListEmployeesQuery = z.infer<typeof listEmployeesQuerySchema>;
