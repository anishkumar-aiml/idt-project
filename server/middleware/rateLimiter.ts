import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [ip: string]: {
    count: number;
    resetTime: number;
  };
}

export function createRateLimiter(options: { windowMs: number; max: number; message: string }) {
  const store: RateLimitStore = {};

  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';
    const now = Date.now();

    if (!store[ip] || now > store[ip].resetTime) {
      store[ip] = {
        count: 1,
        resetTime: now + options.windowMs,
      };
      return next();
    }

    store[ip].count += 1;

    if (store[ip].count > options.max) {
      const waitSeconds = Math.ceil((store[ip].resetTime - now) / 1000);
      res.status(429).json({
        success: false,
        message: `${options.message} (Try again in ${waitSeconds}s)`,
      });
      return;
    }

    next();
  };
}
