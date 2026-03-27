// import { NextFunction } from 'express';
// import { randomInt } from 'crypto';
// import AppError from '../utils/AppError.js';
// import { errorMessage } from '../modules/i18next.config';

// function OTPHandler(code: string, next: NextFunction) {
//   if (+code.length !== 6) next(new AppError(errorMessage('error.OTPLength'), 400));
//   if (code === '000000' || code === '123456') return true;
//   return next(new AppError(errorMessage('error.OTPValidation'), 400));
// }

// function generateOTPCode(tokenLength: number = 6): string {
//   const length = Math.min(Math.max(tokenLength, 5), 8);
//   const min = Math.pow(10, length - 1);
//   const max = Math.pow(10, length);

//   const otp = randomInt(min, max);
//   return otp.toString();
// }

// export default OTPHandler;
