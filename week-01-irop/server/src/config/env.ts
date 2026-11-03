import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  PORT: z.union([z.string(), z.number()]).default('5000').transform(Number),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGODB_URI: z.string().default('mongodb://localhost:27017/irop_dev'),
  MONGODB_URI_TEST: z.string().optional(),
  JWT_SECRET: z.string().default('temporary-fallback-jwt-secret-key-32-chars'),
  JWT_EXPIRES_IN: z.string().default('1d'),
  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
});

const parsed = envSchema.safeParse(process.env);

let envData: z.infer<typeof envSchema>;

if (!parsed.success) {
  console.warn('⚠️ Missing or invalid environment variables:', parsed.error.flatten().fieldErrors);
  envData = {
    PORT: Number(process.env.PORT) || 5000,
    NODE_ENV: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/irop_dev',
    MONGODB_URI_TEST: process.env.MONGODB_URI_TEST || process.env.MONGODB_URI || 'mongodb://localhost:27017/irop_test',
    JWT_SECRET: process.env.JWT_SECRET || 'temporary-fallback-jwt-secret-key-32-chars',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1d',
    CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || '*',
  };
} else {
  envData = parsed.data;
  if (!envData.MONGODB_URI_TEST && process.env.MONGODB_URI_TEST) {
    envData.MONGODB_URI_TEST = process.env.MONGODB_URI_TEST;
  }
}

export const env = envData;

export function getMongoUri(): string {
  if (env.NODE_ENV === 'test' || process.env.NODE_ENV === 'test') {
    return process.env.MONGODB_URI_TEST || env.MONGODB_URI_TEST || process.env.MONGODB_URI || env.MONGODB_URI || 'mongodb://127.0.0.1:27017/irop_test';
  }
  return process.env.MONGODB_URI || env.MONGODB_URI || 'mongodb://127.0.0.1:27017/irop_dev';
}
