import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';
import requestIp from 'request-ip';
import { Request } from 'express';
import { errorMessage } from '../modules/i18next.config';

const getClientIp = (req: Request): string => {
  const maybeClientIp = (req as any).clientIp ?? requestIp.getClientIp(req) ?? req.ip;
  return String(maybeClientIp ?? 'unknown')
    .replace(/:\d+$/, '')
    .replace(/%.*$/, '');
};

export const publicLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 100,
  // message: 'Too many requests. Try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIp,

  handler: (req, res) => {
    res.status(429).json({
      status: 'fail',
      message: errorMessage('error.tooManyRequests'),
    });
  },
});

export const adminLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 3 * 60 * 1000,
  max: 100,
  // message: 'Too many admin requests. Try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIp,

  handler: (req, res) => {
    res.status(429).json({
      status: 'fail',
      message: 'Too many requests. Try again later.',
    });
  },
});
