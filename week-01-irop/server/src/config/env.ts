import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('5000').transform(Number),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  MONGODB_URI_TEST: z.string().optional(),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  JWT_EXPIRES_IN: z.string().default('1d'),
  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
});

const parsed = envSchema.safeParse(process.env);

let envData: z.infer<typeof envSchema>;

if (!parsed.success) {
  console.warn('⚠️ Missing or invalid environment variables:', parsed.error.flatten().fieldErrors);
  envData = {
    PORT: Number(process.env.PORT) || 5000,
    NODE_ENV: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'production',
    MONGODB_URI: process.env.MONGODB_URI || '',
    JWT_SECRET: process.env.JWT_SECRET || 'temporary-fallback-jwt-secret-key-32-chars',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1d',
    CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || '*',
  };
} else {
  envData = parsed.data;
}

export const env = envData;

export function getMongoUri(): string {
  if (env.NODE_ENV === 'test') {
    if (!env.MONGODB_URI_TEST) {
      throw new Error('MONGODB_URI_TEST is required when NODE_ENV=test');
    }
    return env.MONGODB_URI_TEST;
  }
  return env.MONGODB_URI;
}
