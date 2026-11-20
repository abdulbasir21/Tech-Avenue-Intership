import { Request, Response } from 'express';
import { z } from 'zod';
import {
  createUser,
  deleteUser,
  listDepartments,
  listRoles,
  listUsers,
  updateUser,
} from '../services/user.service';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';

const listUsersQuerySchema = z.object({
  search: z.string().optional(),
  role: z.string().optional(),
  status: z.enum(['active', 'inactive', 'all']).default('all'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

const createUserSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters').max(150),
  email: z.string().trim().toLowerCase().email('Please enter a valid email address').max(255),
  username: z
    .string()
    .trim()
    .min(3, 'Username must be at least 3 characters')
    .max(50)
    .regex(/^[a-zA-Z0-9._-]+$/, 'Username can only contain letters, numbers, dots, underscores, or hyphens'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100),
  roleId: z.coerce.number().int().positive('Please select a role'),
  departmentId: z.coerce.number().int().positive('Please select a department'),
});

const updateUserSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters').max(150).optional(),
  email: z.string().trim().toLowerCase().email('Please enter a valid email address').max(255).optional(),
  username: z
    .string()
    .trim()
    .min(3, 'Username must be at least 3 characters')
    .max(50)
    .regex(/^[a-zA-Z0-9._-]+$/, 'Username can only contain letters, numbers, dots, underscores, or hyphens')
    .optional(),
  password: z.preprocess(
    (val) => (typeof val === 'string' && val.trim() === '' ? undefined : val),
    z.string().min(8, 'Password must be at least 8 characters').max(100).optional()
  ),
  roleId: z.coerce.number().int().positive('Please select a role').optional(),
  departmentId: z.coerce.number().int().positive('Please select a department').optional(),
  isActive: z.boolean().optional(),
});

function parseIdParam(raw: string | string[] | undefined): number {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new AppError('Invalid user ID', 400);
  }
  return parsed;
}

export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  const query = listUsersQuerySchema.parse(req.query);
  const result = await listUsers(query);
  res.status(200).json({
    success: true,
    data: result,
  });
});

export const createUserHandler = asyncHandler(async (req: Request, res: Response) => {
  const payload = createUserSchema.parse(req.body);
  const user = await createUser(payload);
  res.status(201).json({
    success: true,
    data: { user },
  });
});

export const updateUserHandler = asyncHandler(async (req: Request, res: Response) => {
  const targetId = parseIdParam(req.params.id);
  const payload = updateUserSchema.parse(req.body);
  const user = await updateUser(targetId, req.user!.id, payload);
  res.status(200).json({
    success: true,
    data: { user },
  });
});

export const deleteUserHandler = asyncHandler(async (req: Request, res: Response) => {
  const targetId = parseIdParam(req.params.id);
  await deleteUser(targetId, req.user!.id);
  res.status(200).json({
    success: true,
    message: 'User deleted successfully',
  });
});

export const getRoles = asyncHandler(async (_req: Request, res: Response) => {
  const roles = await listRoles();
  res.status(200).json({
    success: true,
    data: { roles },
  });
});

export const getDepartments = asyncHandler(async (_req: Request, res: Response) => {
  const departments = await listDepartments();
  res.status(200).json({
    success: true,
    data: { departments },
  });
});
