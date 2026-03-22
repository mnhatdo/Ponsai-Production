import rateLimit from 'express-rate-limit';

const RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000);
const RATE_LIMIT_MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX_REQUESTS || 100);

export const authLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: Math.min(RATE_LIMIT_MAX_REQUESTS, 20),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  }
});

export const paymentLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: Math.min(RATE_LIMIT_MAX_REQUESTS, 30),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many payment requests, please try again later.'
  }
});
