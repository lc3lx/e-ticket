import { Response, NextFunction } from 'express';
import { CustomRequest } from '../interfaces/auth/extendRequest.dto';
import mtnEPaymentService, { MTNEPaymentService } from '../services/MTNEPayment.service';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';
import { DefaultSuccessResponse, defaultSuccessResponse } from '../common/messages/en/default.response.js';
import { errorMessage } from '../modules/i18next.config';

class MTNEPaymentController {
  private MTNEPaymentService: MTNEPaymentService;

  constructor(MTNEPaymentService: MTNEPaymentService) {
    this.MTNEPaymentService = MTNEPaymentService;
  }

  public getAllMTNEPayment = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const allMTNEPayment = await this.MTNEPaymentService.getAllInvoices(req, next);
    if (!allMTNEPayment) return next(new AppError(errorMessage('error.noMTNEPaymentFound'), 404));

    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { allMTNEPayment },
    };
    res.status(200).json(successResponse);
  });
}

export default new MTNEPaymentController(mtnEPaymentService);
