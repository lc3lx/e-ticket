/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextFunction } from 'express';

const catchAsyncService =
  <T>(fn: (data: T, next: NextFunction) => Promise<any>) =>
  (data: T, next: NextFunction) =>
    fn(data, next).catch(next);

export default catchAsyncService;
