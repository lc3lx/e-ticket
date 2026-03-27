import { Response, NextFunction } from 'express';
import suggestionSevice, { SuggestionSevice } from '../services/suggestions.service';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';
import { DefaultSuccessResponse, defaultSuccessResponse } from '../common/messages/en/default.response.js';
import { CreateSuggestionDto } from '../interfaces/suggestion/createSuggestion.dto.js';
import { CustomRequest } from '../interfaces/auth/extendRequest.dto';
import { errorMessage } from '../modules/i18next.config';

class EventTypeController {
  private suggestionSevice: SuggestionSevice;

  constructor(suggestionSevice: SuggestionSevice) {
    this.suggestionSevice = suggestionSevice;
  }

  public getAllSuggestions = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const allSuggestions = await this.suggestionSevice.getAllSuggestions(req, next);
    if (!allSuggestions) return next(new AppError(errorMessage('error.emptySuggestions'), 404));

    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { allSuggestions },
    };
    res.status(200).json(successResponse);
  });

  public getAllSuggestionsByUser = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { userId } = req.params;
    if (!userId) return next(new AppError('Provide userId in the params', 400));
    const suggestionsByUser = await this.suggestionSevice.getSuggestionsByUser(req, next, Number(userId));
    if (!suggestionsByUser) return next(new AppError('There is no Suggestions Yet for this User', 404));

    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { suggestionsByUser },
    };
    res.status(200).json(successResponse);
  });

  public getAllSuggestionsByEvent = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { eventId } = req.params;
    if (!eventId) return next(new AppError('Provide eventId in the params', 400));
    const suggestionsByEvent = await this.suggestionSevice.getSuggestionsByEvent(req, next, Number(eventId));
    if (!suggestionsByEvent) return next(new AppError('There is no Suggestions Yet on this Event', 404));

    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { suggestionsByEvent },
    };
    res.status(200).json(successResponse);
  });

  public createSuggestion = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const userId: number = req.normalUserFromReq?.id || req.body.userId;
    const data: CreateSuggestionDto = req.body;
    if (!data) return next(new AppError('Provide Appropiate data in the Body', 400));
    const suggestion = await this.suggestionSevice.createSuggestion({ ...data, userId }, next);
    if (!suggestion) return next(new AppError('Some thing goes wrong while Creating new Suggestion', 400));

    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { suggestion },
    };

    res.status(200).json(successResponse);
  });
}

export default new EventTypeController(suggestionSevice);
