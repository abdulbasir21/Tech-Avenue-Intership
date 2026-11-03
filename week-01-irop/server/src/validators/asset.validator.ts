import { z } from 'zod';

export const createAssetSchema = z.object({
  name: z.string().min(1, 'Name is required').trim(),
  kind: z.enum(['hardware', 'software']),
  serialNumber: z.string().trim().optional(),
  status: z.enum(['in_use', 'available', 'in_repair']).optional().default('available'),
  assignedTo: z.string().optional().nullable(),
  purchaseDate: z.string().optional().nullable(),
});

export const updateAssetSchema = z.object({
  name: z.string().min(1).trim().optional(),
  kind: z.enum(['hardware', 'software']).optional(),
  serialNumber: z.string().trim().optional(),
  status: z.enum(['in_use', 'available', 'in_repair']).optional(),
  purchaseDate: z.string().optional().nullable(),
});

export const assignAssetSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
});

export const listAssetsQuerySchema = z.object({
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('20').transform(Number),
  status: z.enum(['in_use', 'available', 'in_repair']).optional(),
  q: z.string().optional(),
});

export type CreateAssetInput = z.infer<typeof createAssetSchema>;
export type UpdateAssetInput = z.infer<typeof updateAssetSchema>;
export type AssignAssetInput = z.infer<typeof assignAssetSchema>;
