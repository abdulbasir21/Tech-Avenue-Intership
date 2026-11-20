import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().min(1).default('1d'),
  CLIENT_URL: z.string().url().default('http://localhost:5173'),
  ADMIN_USERNAME: z.string().min(1, 'ADMIN_USERNAME is required'),
  ADMIN_PASSWORD: z.string().min(8, 'ADMIN_PASSWORD must be at least 8 characters'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const failingKeys = parsed.error.issues.map((issue) => issue.path.join('.'));
  console.error('Invalid or missing environment variables:', failingKeys.join(', '));
  process.exit(1);
}

export const env = parsed.data;
