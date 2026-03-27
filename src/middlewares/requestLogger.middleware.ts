import { Request, Response, NextFunction } from 'express';
import onFinished from 'on-finished';
import logger from '../utils/logger';
import { CustomRequest } from '../interfaces/auth/extendRequest.dto';

function maskSensitive(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(maskSensitive);

  const out: any = {};
  for (const [k, v] of Object.entries(obj)) {
    if (/(password|otp|token|secret|key|pin|code|Code,Otp|OTP)/i.test(k)) {
      out[k] = '*****';
    } else if (typeof v === 'object') {
      out[k] = maskSensitive(v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

export const requestLogger = (req: CustomRequest, res: Response, next: NextFunction) => {
  const start = Date.now();

  let sanitizedBody: Record<string, any> = {};
  let safeQuery: Record<string, any> = {};

  // Sanitize body
  if (req.is('multipart/form-data')) {
    if (req.files) {
      if (Array.isArray(req.files)) {
        sanitizedBody['files'] = req.files.map((f: any) => ({
          name: f.originalname,
          sizeKB: (f.size / 1024).toFixed(2),
        }));
      } else {
        const fileGroups: Record<string, any[]> = {};
        for (const [key, arr] of Object.entries(req.files as Record<string, any[]>)) {
          fileGroups[key] = arr.map((f: any) => ({
            name: f.originalname,
            sizeKB: (f.size / 1024).toFixed(2),
          }));
        }
        sanitizedBody['files'] = fileGroups;
      }
    } else if ((req as any).file) {
      sanitizedBody['file'] = {
        name: (req as any).file.originalname,
        sizeKB: ((req as any).file.size / 1024).toFixed(2),
      };
    }

    for (const [k, v] of Object.entries(req.body || {})) {
      sanitizedBody[k] = typeof v === 'string' ? (v.length > 200 ? v.slice(0, 200) + '...' : v) : v;
    }
  } else if (req.is('application/json')) {
    sanitizedBody = maskSensitive(req.body);
  }

  safeQuery = maskSensitive(req.query);

  // Store sanitized body & query for error logger
  (req as any)._sanitizedBody = sanitizedBody;
  (req as any)._sanitizedQuery = safeQuery;

  onFinished(res, () => {
    const duration = Date.now() - start;

    const user =
      req.normalUserFromReq?.mobileNumber ||
      req.supervisorFromReq?.username ||
      req.adminFromReq?.email ||
      req.scannerUserFromRequest?.name ||
      'Unauthenticated';

    const message = [
      `[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`,
      `Status: ${res.statusCode}`,
      `Duration: ${duration}ms`,
      `User: ${user}`,
      Object.keys(safeQuery).length ? `Query: ${JSON.stringify(safeQuery)}` : '',
      Object.keys(sanitizedBody).length ? `Body: ${JSON.stringify(sanitizedBody)}` : '',
    ]
      .filter(Boolean)
      .join(' | ');

    logger.info(message);
  });

  next();
};
