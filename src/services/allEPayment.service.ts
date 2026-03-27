import path from 'path';
import { NextFunction } from 'express';
import { Transaction } from 'sequelize';
import EPayment from '../models/allEPayment.model.js';
import { errorMessage } from '../modules/i18next.config.js';
import AppError from '../utils/AppError.js';
import catchAsyncService from '../utils/catchAsyncService.js';
import catchAsyncReqNext from '../utils/catchAsyncReqNext.js';
import APIFeatures from '../utils/apiFeatures.js';
import { CustomRequest } from '../interfaces/auth/extendRequest.dto.js';
import { createPaymentMethod } from '../modules/zodValidation/ePayment/general/createPayment.config.js';
import { updatePaymentMethod } from '../modules/zodValidation/ePayment/general/updatePayment.config.js';
import z from 'zod';
import upload from '../modules/multer.config.js';
import pathName from '../utils/serverAndPort.js';

type PaymentInput = z.infer<typeof createPaymentMethod>;

type UpdatePaymentDTO = z.infer<typeof updatePaymentMethod>;

export class EPaymentService {
  public createPayment = catchAsyncReqNext(async (req: CustomRequest, next: NextFunction, data: PaymentInput) => {
    const validated = await createPaymentMethod.safeParseAsync(data);
    if (!validated.success) return next(validated.error);

    const payment = await EPayment.create(validated.data);
    return payment;
  });

  public getAllPayments = catchAsyncReqNext(async (req: CustomRequest, next: NextFunction) => {
    const features = new APIFeatures(EPayment, req.query as Record<string, string>)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const totalCount = await EPayment.count({ where: features.query.where });
    const data = await features.execute();

    return {
      page: features.page,
      totalPages: Math.ceil(totalCount / features.limit),
      totalItemsInPage: data.length,
      limit: features.limit,
      totalCount,
      data,
      hasPreviousPage: features.page > 1,
      hasNextPage: features.page < Math.ceil(totalCount / features.limit),
    };
  });

  public getAllPaymentsNoPaggination = catchAsyncReqNext(async (req: CustomRequest, next: NextFunction) => {
    const allPayments = await EPayment.findAll({ where: { isEnabled: true } });

    return allPayments;
  });

  public getOnePayment = catchAsyncService(async (id: number, next: NextFunction) => {
    const payment = await EPayment.findByPk(id);
    if (!payment) return next(new AppError(errorMessage('error.paymentNotFound'), 404));
    return payment;
  });

  public updatePayment = catchAsyncService(async (data: UpdatePaymentDTO, next: NextFunction) => {
    const validated = await updatePaymentMethod.safeParseAsync(data);
    if (!validated.success) return next(validated.error);

    const { id, ...updateData } = validated.data;

    const payment = await EPayment.findByPk(id);
    if (!payment) return next(new AppError(errorMessage('error.paymentNotFound'), 404));

    await payment.update(updateData);
    return payment;
  });

  public deletePayment = catchAsyncService(async (id: number, next: NextFunction) => {
    const payment = await EPayment.findByPk(id);
    if (!payment) return next(new AppError(errorMessage('error.paymentNotFound'), 404));
    await payment.destroy();
    return { message: 'Deleted successfully' };
  });

  public getOnePaymentService = async (serviceName: string, transaction: Transaction, next: NextFunction) => {
    const payment = await EPayment.findOne({ where: { ServiceName: serviceName }, transaction });
    if (!payment) {
      next(new AppError(errorMessage('error.paymentNotFound'), 404));
      return;
    }
    return payment.id;
  };

  public getOnePaymentByID = async (id: number, transaction: Transaction, next: NextFunction) => {
    const payment = await EPayment.findByPk(id);
    if (!payment) {
      await transaction.rollback();
      return next(new AppError(errorMessage('error.paymentNotFound'), 404));
    }
    return payment.ServiceName;
  };

  public getOnePaymentServiceMiddleware = async (serviceName: string, next: NextFunction) => {
    const payment = await EPayment.findOne({ where: { ServiceName: serviceName } });
    if (!payment) {
      next(new AppError(errorMessage('error.paymentNotFound'), 404));
      return;
    }
    return payment;
  };

  public uploadSingleLogoPAymentMethodService = upload.single('paymentMethodLogo');

  public savePaymentMethodLogoOnUpdate = catchAsyncReqNext(async (req: CustomRequest, next: NextFunction) => {
    const paymentMethodName = req.body.ServiceName || 'Payment Method';

    if (!paymentMethodName) return next(new AppError('service name not found in the context', 400));

    const fileName = new URL(path.join('paymentMethodLogo', req.body.paymentMethodLogo), pathName).href;
    req.body.paymentMethodLogo = fileName;
  });
}

export default new EPaymentService();
