import { NextFunction, Response } from 'express';
import { CustomRequest } from '../interfaces/auth/extendRequest.dto';
import AppError from '../utils/AppError.js';
import { errorMessage } from '../modules/i18next.config';
import EPaymentService from '../services/allEPayment.service';

async function EPaymentStatus(req: CustomRequest, res: Response, next: NextFunction) {
  if (!req.body.ServiceName) return next(new AppError(errorMessage('error.serviceNameNotProvided'), 400));
  const paymentMethod = await EPaymentService.getOnePaymentServiceMiddleware(req.body.ServiceName, next);
  if (!paymentMethod) return next(new AppError(errorMessage('error.paymentMethodNotFound'), 400));
  if (!paymentMethod?.isEnabled) return next(new AppError(errorMessage('error.serviceDisabled'), 400));

  next();
}

export default EPaymentStatus;
