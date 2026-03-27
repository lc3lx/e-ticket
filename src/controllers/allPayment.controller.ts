import { Response, NextFunction } from 'express';
import { CustomRequest } from '../interfaces/auth/extendRequest.dto.js';
import allEPayment, { EPaymentService } from '../services/allEPayment.service.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';
import { DefaultSuccessResponse, defaultSuccessResponse } from '../common/messages/en/default.response.js';
import { errorMessage } from '../modules/i18next.config.js';

class EPaymentController {
  private allEPayment: EPaymentService;
  // public uploadPaymentMethodLogo;

  constructor(ePaymentService: EPaymentService) {
    this.allEPayment = ePaymentService;
    // this.uploadPaymentMethodLogo = this.allEPayment.uploadSingleLogoPAymentMethodService;
  }

  public getAllPayments = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const allPayments = await this.allEPayment.getAllPayments(req, next);
    if (!allPayments) return next(new AppError(errorMessage('error.emptyPayments'), 404));

    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { allPayments },
    };
    res.status(200).json(successResponse);
  });

  public getAllPaymentsWithoutPaggination = catchAsync(
    async (req: CustomRequest, res: Response, next: NextFunction) => {
      const allPayments = await this.allEPayment.getAllPaymentsNoPaggination(req, next);
      if (!allPayments) return next(new AppError(errorMessage('error.emptyPayments'), 404));

      const successResponse: DefaultSuccessResponse = {
        ...defaultSuccessResponse(),
        data: { allPayments },
      };
      res.status(200).json(successResponse);
    },
  );

  // public createPayment = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
  //   const newPayment = await this.allEPayment.createPayment(req, next, req.body);
  //   const successResponse: DefaultSuccessResponse = {
  //     ...defaultSuccessResponse(),
  //     data: { newPayment },
  //   };
  //   res.status(201).json(successResponse);
  // });

  public getOnePayment = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { paymentId } = req.params;

    if (!paymentId) return next(new AppError('missing payment id', 404));

    const payment = await this.allEPayment.getOnePayment(Number(paymentId), next);
    if (!payment) return next(new AppError(errorMessage('error.paymentNotFound'), 404));

    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { payment },
    };
    res.status(200).json(successResponse);
  });

  public updatePayment = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const updateData = { ...req.body, id: Number(req.params.paymentId) };

    if (!updateData.id) return next(new AppError('missing payment id', 404));

    const updatedPayment = await this.allEPayment.updatePayment(updateData, next);
    if (!updatedPayment) return next(new AppError(errorMessage('error.paymentNotFound'), 404));

    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { updatedPayment },
    };
    res.status(200).json(successResponse);
  });

  public deletePayment = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { paymentId } = req.params;
    if (!paymentId) return next(new AppError('missing paymentId', 400));

    const deletedPayment = await this.allEPayment.deletePayment(Number(paymentId), next);
    if (deletedPayment) res.status(204).json({});
  });

  public uploadPaymentMethodLogo = allEPayment.uploadSingleLogoPAymentMethodService;

  public savePaymentMethodLogo = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    if (!req.file) return next();
    await this.allEPayment.savePaymentMethodLogoOnUpdate(req, next);
    next();
  });
}

export default new EPaymentController(allEPayment);
