import { z } from 'zod';

export const createInventorySchema = z.object({
  name: z.string().min(1, 'Name is required').trim(),
  category: z.string().min(1, 'Category is required').trim(),
  quantity: z.number().min(0, 'Quantity must be >= 0'),
  threshold: z.number().min(0, 'Threshold must be >= 0'),
  unit: z.string().min(1, 'Unit is required').trim(),
});

export const updateInventorySchema = z.object({
  name: z.string().min(1).trim().optional(),
  category: z.string().min(1).trim().optional(),
  quantity: z.number().min(0).optional(),
  threshold: z.number().min(0).optional(),
  unit: z.string().min(1).trim().optional(),
});

export const adjustInventorySchema = z.object({
  delta: z.number().refine((d) => d === 1 || d === -1, 'Delta must be +1 or -1'),
});

export const listInventoryQuerySchema = z.object({
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('50').transform(Number),
});

export type CreateInventoryInput = z.infer<typeof createInventorySchema>;
export type UpdateInventoryInput = z.infer<typeof updateInventorySchema>;
export type AdjustInventoryInput = z.infer<typeof adjustInventorySchema>;
