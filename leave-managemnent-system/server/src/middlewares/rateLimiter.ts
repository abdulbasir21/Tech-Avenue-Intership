import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

const shouldSkip = (): boolean =>
  env.NODE_ENV === 'test' && process.env.ENABLE_TEST_RATE_LIMIT !== 'true';

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: shouldSkip,
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many login attempts. Please try again after 15 minutes.',
      data: null,
    });
  },
});

export const otpRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: shouldSkip,
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many OTP requests. Please try again after 15 minutes.',
      data: null,
    });
  },
});
