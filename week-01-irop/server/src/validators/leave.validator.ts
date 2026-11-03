import { z } from 'zod';

export const createLeaveSchema = z.object({
  type: z.enum(['casual', 'sick', 'annual', 'wfh']),
  startDate: z.string().refine((d) => !isNaN(Date.parse(d)), 'Invalid start date'),
  endDate: z.string().refine((d) => !isNaN(Date.parse(d)), 'Invalid end date'),
  reason: z.string().min(1, 'Reason is required').trim(),
});

export const reviewLeaveSchema = z.object({
  reviewNote: z.string().trim().optional().default(''),
});

export const listLeavesQuerySchema = z.object({
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('20').transform(Number),
  status: z
    .enum(['pending', 'approved', 'rejected', 'cancelled'])
    .optional(),
});

export type CreateLeaveInput = z.infer<typeof createLeaveSchema>;
export type ReviewLeaveInput = z.infer<typeof reviewLeaveSchema>;
