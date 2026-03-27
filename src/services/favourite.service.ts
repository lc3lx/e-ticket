import { NextFunction } from 'express';
import { fn, col, Sequelize, Transaction } from 'sequelize';
import Event from '../models/event.model';
import NormalUser from '../models/normalUser.model';
import EventType from '../models/eventType.model';
import Province from '../models/provinces.model';
import Favorite from '../models/favorite.model';
import catchAsyncService from '../utils/catchAsyncService.js';
import catchAsyncReqNext from '../utils/catchAsyncReqNext.js';
import { AddToFavourite } from '../interfaces/favourite/addToFavourite.dto';
import { validateForeignKey } from '../utils/validateForeignKey.js';
import AppError from '../utils/AppError.js';
import APIFeatures from '../utils/apiFeatures.js';
import { errorMessage } from '../modules/i18next.config';

export class FavouriteService {
  private sequelize: Sequelize;

  constructor(sequelize: Sequelize) {
    this.sequelize = sequelize;
  }

  public addToFavourite = catchAsyncService(async (data: AddToFavourite, next: NextFunction) => {
    const { userId, eventId } = data;

    if (!eventId || !userId) return next(new AppError('Enter Appropiate Data', 400));
    if (!(await validateForeignKey(NormalUser, userId, 'NormalUser'))) return next(new AppError('Invalid userId', 400));
    if (!(await validateForeignKey(Event, eventId, 'Event'))) return next(new AppError('Enter Valid Event Id', 400));

    const favorite = await Favorite.create({ userId, eventId }, { validate: true });

    return favorite;
  });

  public removeFromFavourite = catchAsyncService(async (data: AddToFavourite, next: NextFunction) => {
    const { userId, eventId } = data;

    if (!eventId || !userId) return next(new AppError('Enter Appropiate Data', 400));
    if (!(await validateForeignKey(NormalUser, userId, 'NormalUser'))) return next(new AppError('Invalid userId', 400));
    if (!(await validateForeignKey(Event, eventId, 'Event'))) return next(new AppError('Enter Event Id', 400));

    const result = await Favorite.destroy({ where: { userId, eventId } });
    if (result === 0) return next(new AppError("Event was not found in user's favorites", 404));
  });

  public getAllFavouriteService = catchAsyncReqNext(async (req, next: NextFunction) => {
    const includeOptions = [
      { model: NormalUser, as: 'userFavourite' },
      { model: Event, as: 'eventFavourite' },
    ];
    const features = new APIFeatures(Favorite, req.query as unknown as Record<string, string>, {
      include: includeOptions,
    })
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const totalCount = await Favorite.count({
      where: features.query.where,
      include: includeOptions,
    });

    const allFavouritesService = await features.execute();

    if (!allFavouritesService) return next(new AppError(errorMessage('error.emptyFavourite'), 404));

    const totalPages = Math.ceil(totalCount / features.limit);
    const totalItemsInPage = allFavouritesService.length;
    const hasPreviousPage = features.page > 1;
    const hasNextPage = features.page < totalPages;

    return {
      page: features.page,
      totalPages,
      totalItemsInPage,
      limit: features.limit,
      totalCount,
      data: allFavouritesService,
      hasPreviousPage,
      hasNextPage,
    };
  });

  public getAllFavouriteByUserService = catchAsyncReqNext(async (req, next: NextFunction, userId: number) => {
    if (!userId) return next(new AppError('Enter Appropiate Data', 400));
    if (!(await validateForeignKey(NormalUser, userId, 'NormalUser'))) return next(new AppError('Invalid userId', 400));

    const includeOptions = [
      { model: NormalUser, as: 'userFavourite' },
      {
        model: Event,
        as: 'eventFavourite',
        include: [
          { model: EventType, as: 'eventTypeRelation' },
          { model: Province, as: 'provinceRelation' },
        ],
      },
    ];
    const features = new APIFeatures(Favorite, req.query as unknown as Record<string, string>, {
      subQuery: false,
      include: includeOptions,
      where: { userId },
    })
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const totalCount = await Favorite.count({
      where: features.query.where,
      include: includeOptions,
    });

    const allFavouritesForUser = await features.execute();

    if (!allFavouritesForUser) return next(new AppError(errorMessage('error.emptyFavourite'), 404));

    const totalPages = Math.ceil(totalCount / features.limit);
    const totalItemsInPage = allFavouritesForUser.length;
    const hasPreviousPage = features.page > 1;
    const hasNextPage = features.page < totalPages;

    return {
      page: features.page,
      totalPages,
      totalItemsInPage,
      limit: features.limit,
      totalCount,
      data: allFavouritesForUser,
      hasPreviousPage,
      hasNextPage,
    };
  });

  public getAllFavouriteGrouppedService = catchAsyncReqNext(async (req, next: NextFunction) => {
    const queryOptions = {
      attributes: ['eventId', [fn('COUNT', col('userId')), 'userCount']],
      include: [
        {
          model: Event,
          as: 'eventFavourite',
          attributes: ['id', 'eventName', 'eventType'],
        },
      ],
      group: ['eventId', 'eventFavourite.id'],
      order: [[fn('COUNT', col('userId')), 'DESC']],
      raw: true,
    };

    const features = new APIFeatures(Favorite, req.query as unknown as Record<string, string>, queryOptions)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const totalCount = await Favorite.count({
      where: features.query.where,
      include: {
        model: Event,
      },
    });

    const allFavouritesByEvent = await features.execute();

    if (!allFavouritesByEvent) return next(new AppError(errorMessage('error.emptyFavourite'), 404));

    const totalPages = Math.ceil(totalCount / features.limit);
    const totalItemsInPage = allFavouritesByEvent.length;
    const hasPreviousPage = features.page > 1;
    const hasNextPage = features.page < totalPages;

    return {
      page: features.page,
      totalPages,
      totalItemsInPage,
      limit: features.limit,
      totalCount,
      data: allFavouritesByEvent,
      hasPreviousPage,
      hasNextPage,
    };
  });

  public checkFavouriteForEvent = catchAsyncService(async (data: AddToFavourite, next: NextFunction) => {
    const { userId, eventId } = data;

    if (!(await validateForeignKey(Event, eventId, 'Event'))) return next(new AppError('Enter Valid Event Id', 400));
    const favorite = await Favorite.findOne({ where: { userId, eventId } });
    if (!favorite) return false;
    return true;
  });
}

import { sequelize } from '../DB/sequelize.js';
export default new FavouriteService(sequelize);
