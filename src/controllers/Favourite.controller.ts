import { Response, NextFunction } from 'express';
import { CustomRequest } from '../interfaces/auth/extendRequest.dto';
import favouriteService, { FavouriteService } from '../services/favourite.service';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';
import { DefaultSuccessResponse, defaultSuccessResponse } from '../common/messages/en/default.response.js';
import { AddToFavourite } from '../interfaces/favourite/addToFavourite.dto';
import { errorMessage } from '../modules/i18next.config';

class FavouriteController {
  private favouriteService: FavouriteService;

  constructor(favouriteService: FavouriteService) {
    this.favouriteService = favouriteService;
  }

  public createFavourite = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { eventId } = req.body;

    const userId = req.normalUserFromReq?.id || req.body.userId;

    if (!eventId) return next(new AppError('Enter Appropiate Data', 400));

    const data: AddToFavourite = { userId, eventId };

    const addToFavourite = await this.favouriteService.addToFavourite(data, next);

    if (!addToFavourite) return next(new AppError('Cannot Add to Favourite.', 400));

    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { addToFavourite },
    };
    res.status(200).json(successResponse);
  });

  public deleteFavourite = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { eventId } = req.body;

    const userId = req.normalUserFromReq?.id || req.body.userId;

    if (!eventId) return next(new AppError('Enter Appropiate Data', 400));

    const data: AddToFavourite = { userId, eventId };

    const removeFromFavourite = await this.favouriteService.removeFromFavourite(data, next);

    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { removeFromFavourite },
    };
    res.status(204).json(successResponse);
  });

  public getAllFavourite = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const allFavourites = await this.favouriteService.getAllFavouriteService(req, next);

    if (!allFavourites) return next(new AppError(errorMessage('error.emptyFavourite'), 404));

    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { allFavourites },
    };
    res.status(200).json(successResponse);
  });

  public getAllFavouriteByUser = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const userId = req.normalUserFromReq?.id || Number(req.params.userId);

    const allFavouriteByUser = await this.favouriteService.getAllFavouriteByUserService(req, next, userId);

    if (!allFavouriteByUser) return;

    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { allFavouriteByUser },
    };
    res.status(200).json(successResponse);
  });

  public getAllFavouriteGroupped = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const eventId = Number(req.params.eventId);

    if (!eventId) return next(new AppError('Please, Choose an event', 400));

    const grouppedFavourite = await this.favouriteService.getAllFavouriteGrouppedService(req, next);

    if (!grouppedFavourite) return;

    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { grouppedFavourite },
    };
    res.status(200).json(successResponse);
  });

  public checkFavourite = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const eventId: number = Number(req.params.eventId);
    const userId = req.normalUserFromReq?.id || req.body.userId;

    if (!eventId) return next(new AppError('provide event Id', 400));

    const data: AddToFavourite = { eventId, userId };

    const isFavourite = await this.favouriteService.checkFavouriteForEvent(data, next);

    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { isFavourite },
    };
    res.status(200).json(successResponse);
  });
}

export default new FavouriteController(favouriteService);
