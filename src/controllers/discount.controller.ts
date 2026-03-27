import { Request, Response, NextFunction } from 'express';
import DiscountCodeService from '../services/discount.service.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';
import { errorMessage } from '../modules/i18next.config.js';
import { DefaultSuccessResponse, defaultSuccessResponse } from '../common/messages/en/default.response.js';

class DiscountCodeController {
  public createDiscountCode = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { code, isPercent, isFixedValue, value, eventId, startFrom, endAt, isDisabled, usageLimit } = req.body;

    const discountCode = await DiscountCodeService.createDiscountCode(
      {
        code,
        isPercent,
        isFixedValue,
        value,
        eventId,
        startFrom: new Date(startFrom),
        endAt: new Date(endAt),
        isDisabled,
        usageLimit,
      },
      next,
    );
    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { discountCode },
    };
    res.status(201).json(successResponse);
  });

  public getAllDiscountCodes = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const discountCodes = await DiscountCodeService.getAllDiscountCodes(req, next);

    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { discountCodes },
    };
    res.status(200).json(successResponse);
  });

  public getDiscountCodeById = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    if (!id) return next(new AppError(errorMessage('discountId is required'), 400));
    const discountCode = await DiscountCodeService.getDiscountCodeById(Number(id), next);

    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { discountCode },
    };
    res.status(200).json(successResponse);
  });

  public updateDiscountCode = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { code, isPercent, isFixedValue, value, eventId, startFrom, endAt, isDisabled } = req.body;

    const discountCode = await DiscountCodeService.updateDiscountCode(
      {
        id: Number(id),
        code,
        isPercent,
        isFixedValue,
        value,
        eventId,
        startFrom: startFrom ? new Date(startFrom) : undefined,
        endAt: endAt ? new Date(endAt) : undefined,
        isDisabled,
      },
      next,
    );
    if (!discountCode) return next(new AppError('invalid', 400));

    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { discountCode },
    };
    res.status(200).json(successResponse);
  });

  public deleteDiscountCode = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    if (!id) return next(new AppError('discount code id is required', 400));
    await DiscountCodeService.deleteDiscountCode(Number(id), next);

    // const successResponse: DefaultSuccessResponse = {
    //     ...defaultSuccessResponse(),
    //     data: { discountCode },
    //   };

    res.status(204);
  });

  public getDiscountInfo = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { discountCode, eventId } = req.params;
    if (!discountCode || !eventId) return next(new AppError('discount code and eventId are required', 400));
    const info = await DiscountCodeService.getDiscountInfo({ discountCode, eventId: Number(eventId) }, next);
    if (!info) return next(new AppError('there is no discounts for this event', 404));
    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { info },
    };
    res.status(200).json(successResponse);
  });
}

export default new DiscountCodeController();
