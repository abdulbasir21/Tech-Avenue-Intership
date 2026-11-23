import { z } from 'zod';

export const departmentIdParamSchema = z.object({
  id: z.string().uuid('Invalid department ID format'),
});

export const createDepartmentSchema = z.object({
  name: z.string().trim().min(2, 'Department name must be at least 2 characters').max(255),
  description: z.string().trim().max(2000).optional().nullable(),
});

export const updateDepartmentSchema = z
  .object({
    name: z.string().trim().min(2, 'Department name must be at least 2 characters').max(255).optional(),
    description: z.string().trim().max(2000).optional().nullable(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;
