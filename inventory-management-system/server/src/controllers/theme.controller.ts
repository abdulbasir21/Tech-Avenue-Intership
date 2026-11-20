import { Request, Response } from 'express';
import { z } from 'zod';
import { getThemeSettings, updateThemeSettings } from '../services/theme.service';
import { asyncHandler } from '../utils/asyncHandler';

const hexRegex = /^#[0-9A-Fa-f]{6}$/;

const updateThemeSchema = z
  .object({
    activeTheme: z.enum(['default', 'emerald', 'purple', 'crimson', 'custom'], {
      message: 'Theme must be one of: default, emerald, purple, crimson, custom',
    }),
    customPrimaryColor: z
      .string()
      .trim()
      .regex(hexRegex, 'Custom primary color must be a valid 6-digit hex color (e.g. #047857)')
      .nullable()
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.activeTheme === 'custom' && !data.customPrimaryColor) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['customPrimaryColor'],
        message: 'A custom primary color is required when using the custom theme',
      });
    }
  });

export const getTheme = asyncHandler(async (_req: Request, res: Response) => {
  const theme = await getThemeSettings();
  res.status(200).json({
    success: true,
    data: theme,
  });
});

export const updateTheme = asyncHandler(async (req: Request, res: Response) => {
  const payload = updateThemeSchema.parse(req.body);
  const theme = await updateThemeSettings(req.user!.id, payload);
  res.status(200).json({
    success: true,
    data: theme,
  });
});
