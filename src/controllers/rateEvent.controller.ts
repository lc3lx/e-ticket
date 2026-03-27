import { Response, NextFunction } from 'express';
import { CustomRequest } from '../interfaces/auth/extendRequest.dto.js';
import rateEventService from '../services/rateEvent.service.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';
import { defaultSuccessResponse, DefaultSuccessResponse } from '../common/messages/en/default.response.js';

class RateEventController {
  public rateEvent = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { eventId, ratingValue } = req.body;
    const userId = req.normalUserFromReq?.id;

    if (!userId || !eventId || ratingValue == null) {
      return next(new AppError('error.missingFields', 400));
    }
    const result = await rateEventService.rateEvent({ userId, eventId, ratingValue }, next);

    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { result },
    };
    res.status(200).json(successResponse);
  });

  public getEventAverageRating = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const eventId = Number(req.params.eventId);
    const result = await rateEventService.getAverageRating(eventId, next);

    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { result },
    };
    res.status(200).json(successResponse);
  });

  public getUserRating = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const eventId = Number(req.params.eventId);
    const userId = req.normalUserFromReq?.id;

    if (!userId) return next(new AppError('Unauthorized', 401));

    const rating = await rateEventService.getUserRating({ userId, eventId }, next);

    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { rating },
    };
    res.status(200).json(successResponse);
  });

  public deleteRating = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const eventId = Number(req.params.eventId);
    const userId = req.normalUserFromReq?.id;

    if (!userId) return next(new AppError('Unauthorized', 401));

    const deleted = await rateEventService.deleteRating({ userId, eventId }, next);
    if (!deleted) return next(new AppError('Rating not found', 404));

    res.status(204).json({ status: 'success' });
  });
}

export default new RateEventController();
