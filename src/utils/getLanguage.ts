import { Request } from 'express';

export const getLanguage: (req: Request) => 'ar' | 'en' = (req: Request) =>
  req.headers['accept-language']?.startsWith('ar') ? 'ar' : 'en';
