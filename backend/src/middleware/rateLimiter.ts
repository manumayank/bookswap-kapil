import { Request, Response, NextFunction } from 'express';
import { sendError } from '../lib/response';

const requests = new Map<string, { count: number; resetAt: number }>();

/** Simple in-memory rate limiter. windowMs in milliseconds, max requests per window. */
export function rateLimit(windowMs: number, max: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    const entry = requests.get(key);

    if (!entry || now > entry.resetAt) {
      requests.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (entry.count >= max) {
      return sendError(res, 'Too many requests, please try again later', 429);
    }

    entry.count++;
    next();
  };
}
