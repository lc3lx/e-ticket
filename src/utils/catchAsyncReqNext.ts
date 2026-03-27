/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextFunction, Request } from 'express';

const catchAsyncNext =
  (fn: (req: Request, next: NextFunction, data?: any) => Promise<unknown>) =>
  (req: Request, next: NextFunction, data?: any) =>
    fn(req, next, data).catch(next);
export default catchAsyncNext;
