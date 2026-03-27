import { Request, Response, NextFunction } from 'express';
import xss from 'xss';

function sanitizeObjectStrings(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeObjectStrings);
  const out: any = {};
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'string') {
      out[k] = xss(v);
    } else if (v && typeof v === 'object') {
      out[k] = sanitizeObjectStrings(v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

export const xssSanitizer = (req: Request, _res: Response, next: NextFunction) => {
  if (req.body) req.body = sanitizeObjectStrings(req.body);
  if (req.query) req.query = sanitizeObjectStrings(req.query);
  if (req.params) req.params = sanitizeObjectStrings(req.params);
  next();
};
