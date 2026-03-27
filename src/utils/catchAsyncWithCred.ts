/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextFunction } from 'express';

const catchAsyncService =
  <T>(fn: (credential: any, data: T, next: NextFunction) => Promise<any>) =>
  (credential: any, data: T, next: NextFunction) =>
    fn(credential, data, next).catch(next);

export default catchAsyncService;
