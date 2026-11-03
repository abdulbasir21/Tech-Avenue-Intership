import { z } from 'zod';

export const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required').trim(),
  email: z.string().email('Invalid email format').toLowerCase().trim(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
      'Password must contain uppercase, lowercase, number, and special character'
    ),
  role: z.enum(['employee', 'manager', 'admin']),
  department: z.string().min(1, 'Department is required').trim(),
  managerId: z.string().optional().nullable(),
});

const quotaUpdateSchema = z.object({
  total: z.number().min(0).optional(),
  used: z.number().min(0).optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).trim().optional(),
  role: z.enum(['employee', 'manager', 'admin']).optional(),
  department: z.string().min(1).trim().optional(),
  managerId: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  quotas: z
    .object({
      casual: quotaUpdateSchema.optional(),
      sick: quotaUpdateSchema.optional(),
      annual: quotaUpdateSchema.optional(),
      wfh: quotaUpdateSchema.optional(),
    })
    .optional(),
});

export const resetPasswordSchema = z.object({
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
      'Password must contain uppercase, lowercase, number, and special character'
    ),
});

export const listUsersQuerySchema = z.object({
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('20').transform(Number),
  role: z.enum(['employee', 'manager', 'admin']).optional(),
  department: z.string().optional(),
  search: z.string().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
