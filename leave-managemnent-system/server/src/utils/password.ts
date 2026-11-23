import bcrypt from 'bcrypt';
import { z } from 'zod';

const BCRYPT_COST = 12;

export const passwordRuleSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .max(128, 'Password must not exceed 128 characters')
  .refine((val) => /[A-Za-z]/.test(val) && /\d/.test(val), {
    message: 'Password must contain at least one letter and one number',
  });

export async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, BCRYPT_COST);
}

export async function comparePassword(
  plainPassword: string,
  hashedPassword: string,
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}
