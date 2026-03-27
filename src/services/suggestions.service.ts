import { NextFunction } from 'express';
import { Sequelize, Transaction } from 'sequelize';
import Suggestions from '../models/suggestion.model.js';
import NormalUser from '../models/normalUser.model.js';
import Event from '../models/event.model.js';
import { Supervisor } from '../models/supervisor.model.js';
import User from '../models/user.model.js';
import { CreateSuggestionDto } from '../interfaces/suggestion/createSuggestion.dto.js';
import AppError from '../utils/AppError.js';
import validateFieldsNames from '../utils/validateFields.js';
import { validateForeignKey } from '../utils/validateForeignKey.js';
import APIFeatures from '../utils/apiFeatures.js';
import catchAsyncReqNext from '../utils/catchAsyncReqNext.js';
import catchAsyncService from '../utils/catchAsyncService.js';
import { errorMessage } from '../modules/i18next.config.js';

export class SuggestionSevice {
  private sequelize: Sequelize;

  constructor(sequelize: Sequelize) {
    this.sequelize = sequelize;
  }

  public createSuggestion = catchAsyncService(async (data: CreateSuggestionDto, next: NextFunction) => {
    const { suggestionText, userId, eventId } = data;
    const isAllowed = validateFieldsNames(this.allowedCreateComplainFields, Object.keys(data));
    if (isAllowed !== true) {
      return next(
        new AppError(
          `${isAllowed.length === 1 ? 'this field is' : 'these fields are'} not allowed:
          ${isAllowed.join(', ')}`,
          400,
        ),
      );
    }
    if (!(await validateForeignKey(NormalUser, data.userId, 'NormalUser')))
      return next(new AppError('Invalid userId', 400));
    if (!(await validateForeignKey(Event, data.eventId, 'Event'))) return next(new AppError('Invalid eventId', 400));

    const existSugestion = await Suggestions.findOne({ where: { userId, eventId } });

    if (existSugestion) return next(new AppError(errorMessage('error.duplicateSuggestions'), 400));

    const suggestion = await Suggestions.create(
      {
        userId,
        eventId,
        suggestionText,
      },
      { validate: true },
    );

    return suggestion;
  });

  public getSuggestionsByEvent = catchAsyncReqNext(async (req, next: NextFunction, eventId: number) => {
    const includeOptions = [
      {
        model: Event,
        as: 'event',
        include: [{ model: Supervisor, as: 'supervisor', include: [{ model: User, as: 'user' }] }],
      },
      { model: NormalUser, as: 'user', include: [{ model: User, as: 'user' }] },
    ];
    const features = new APIFeatures(Suggestions, req.query as unknown as Record<string, string>, {
      include: includeOptions,
      where: { eventId },
    })
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const totalCount = await Suggestions.count({
      where: features.query.where,
      include: includeOptions,
    });

    const suggestions = await features.execute();
    if (!suggestions) return next(new AppError(errorMessage('error.emptySuggestions'), 404));

    const totalPages = Math.ceil(totalCount / features.limit);
    const totalItemsInPage = suggestions.length;
    const hasPreviousPage = features.page > 1;
    const hasNextPage = features.page < totalPages;

    return {
      page: features.page,
      totalPages,
      totalItemsInPage,
      limit: features.limit,
      totalCount,
      data: suggestions,
      hasPreviousPage,
      hasNextPage,
    };
  });

  public getSuggestionsByUser = catchAsyncReqNext(async (req, next: NextFunction, userId: number) => {
    const includeOptions = [
      {
        model: Event,
        as: 'event',
        include: [{ model: Supervisor, as: 'supervisor', include: [{ model: User, as: 'user' }] }],
      },
      { model: NormalUser, as: 'user', include: [{ model: User, as: 'user' }] },
    ];
    const features = new APIFeatures(Suggestions, req.query as unknown as Record<string, string>, {
      include: includeOptions,
      where: { userId },
    })
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const totalCount = await Suggestions.count({
      where: features.query.where,
      include: includeOptions,
    });

    const suggestions = await features.execute();
    if (!suggestions) return next(new AppError(errorMessage('error.emptySuggestions'), 404));

    const totalPages = Math.ceil(totalCount / features.limit);
    const totalItemsInPage = suggestions.length;
    const hasPreviousPage = features.page > 1;
    const hasNextPage = features.page < totalPages;

    return {
      page: features.page,
      totalPages,
      totalItemsInPage,
      limit: features.limit,
      totalCount,
      data: suggestions,
      hasPreviousPage,
      hasNextPage,
    };
  });

  public getAllSuggestions = catchAsyncReqNext(async (req, next: NextFunction) => {
    const includeOptions = [
      {
        model: Event,
        as: 'event',
        include: [{ model: Supervisor, as: 'supervisor', include: [{ model: User, as: 'user' }] }],
      },
      { model: NormalUser, as: 'user', include: [{ model: User, as: 'user' }] },
    ];
    const features = new APIFeatures(Suggestions, req.query as unknown as Record<string, string>, {
      include: includeOptions,
    })
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const totalCount = await Suggestions.count({
      where: features.query.where,
      include: includeOptions,
    });
    const suggestions = await features.execute();

    if (!suggestions) return next(new AppError(errorMessage('error.emptySuggestions'), 404));

    const totalPages = Math.ceil(totalCount / features.limit);
    const totalItemsInPage = suggestions.length;
    const hasPreviousPage = features.page > 1;
    const hasNextPage = features.page < totalPages;

    return {
      page: features.page,
      totalPages,
      totalItemsInPage,
      limit: features.limit,
      totalCount,
      data: suggestions,
      hasPreviousPage,
      hasNextPage,
    };
  });

  private allowedCreateComplainFields = ['suggestionText', 'userId', 'eventId'];
}

import { sequelize } from '../DB/sequelize.js';
export default new SuggestionSevice(sequelize);
