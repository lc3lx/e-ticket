import { Response, NextFunction } from 'express';
import { CustomRequest } from '../interfaces/auth/extendRequest.dto';
import syriatelEPayment, { SyriatelEPaymentService } from '../services/syriatelEPayment.service';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';
import { DefaultSuccessResponse, defaultSuccessResponse } from '../common/messages/en/default.response.js';
import { errorMessage } from '../modules/i18next.config';

class SyriatelEPaymentController {
  private SyriatelEPaymentService: SyriatelEPaymentService;

  constructor(SyriatelEPaymentService: SyriatelEPaymentService) {
    this.SyriatelEPaymentService = SyriatelEPaymentService;
  }

  public getAllSyriatelEPayment = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    // const allSyriatelEPayment = await this.SyriatelEPaymentService.getAllInvoices(req, next);
    // if (!allSyriatelEPayment) return next(new AppError(errorMessage('error.noSyriatelEPaymentFound'), 404));

    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      //   data: { allSyriatelEPayment },
    };
    res.status(200).json(successResponse);
  });
}

export default new SyriatelEPaymentController(syriatelEPayment);
