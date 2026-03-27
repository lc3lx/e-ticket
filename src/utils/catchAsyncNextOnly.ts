import { NextFunction } from 'express';

const catchAsyncNext = (fn: (next: NextFunction) => Promise<unknown>) => (next: NextFunction) => fn(next).catch(next);
export default catchAsyncNext;
