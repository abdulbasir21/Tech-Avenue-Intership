import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DIRECT_URL: z.string().min(1).optional(),
  CORS_ORIGINS: z.string().default('http://localhost:3000'),
  PUBLIC_API_URL: z.string().optional().default(''),
  VERCEL_URL: z.string().optional().default(''),
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_REMEMBER_EXPIRES_IN: z.string().default('30d'),
  JWT_RESET_EXPIRES_IN: z.string().default('15m'),
  EMAIL_PROVIDER: z.enum(['console', 'smtp', 'brevo_api']).optional(),
  EMAIL_FROM: z.string().trim().min(1).default('no-reply@example.com'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_HOST: z.string().optional(),
  EMAIL_PORT: z.coerce.number().int().positive().optional(),
  EMAIL_USER: z.string().optional(),
  EMAIL_PASS: z.string().optional(),
  BREVO_API_KEY: z.string().optional(),
  SEED_ADMIN_EMAIL: z.string().email().default('admin@example.com'),
  SEED_ADMIN_PASSWORD: z.string().optional(),
  SEED_SAMPLE_PASSWORD: z.string().optional(),
  SEED_ORG_NAME: z.string().default('Demo Organization'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('; ');
  throw new Error(`Invalid environment configuration: ${details}`);
}

const smtpHost = parsed.data.SMTP_HOST ?? parsed.data.EMAIL_HOST;
const smtpPort = parsed.data.SMTP_PORT ?? parsed.data.EMAIL_PORT;
const smtpUser = parsed.data.SMTP_USER ?? parsed.data.EMAIL_USER;
const smtpPass = parsed.data.SMTP_PASS ?? parsed.data.EMAIL_PASS;

const resolvedEmailProvider =
  parsed.data.EMAIL_PROVIDER ?? (smtpHost ? 'smtp' : 'console');

export const env = {
  ...parsed.data,
  EMAIL_PROVIDER: resolvedEmailProvider,
  smtpHost,
  smtpPort,
  smtpUser,
  smtpPass,
  corsOrigins: parsed.data.CORS_ORIGINS.split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0),
};
