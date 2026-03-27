import { Response, NextFunction } from 'express';
import { CustomRequest } from '../interfaces/auth/extendRequest.dto';
import complainService, { ComplainService } from '../services/complain.service';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';
import { DefaultSuccessResponse, defaultSuccessResponse } from '../common/messages/en/default.response.js';
import { CreateComplainDto } from '../interfaces/complain/createComplain.dto.js';
import { errorMessage } from '../modules/i18next.config';

class EventTypeController {
  private complainService: ComplainService;

  constructor(complainService: ComplainService) {
    this.complainService = complainService;
  }

  public getAllComplains = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const allComplains = await this.complainService.getAllComplaints(req, next);
    if (!allComplains) return next(new AppError(errorMessage('error.emptyComplains'), 404));

    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { allComplains },
    };
    res.status(200).json(successResponse);
  });

  public readComplaint = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    if (!req.params.complainId) return next(new AppError('please provide a complaint id', 400));
    const readedComplaint = await this.complainService.readComplain(Number(req.params.complainId), next);
    if (!readedComplaint) return next(new AppError('complaint not found', 404));
    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { readedComplaint },
    };
    res.status(200).json(successResponse);
  });

  public getAllComplainsByUser = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { userId } = req.params;
    if (!userId) return next(new AppError('Provide userId in the params', 400));
    const complainsByUser = await this.complainService.getComplaintsByUser(req, next, Number(userId));
    if (!complainsByUser) return next(new AppError(errorMessage('error.emptyComplainsForUser'), 404));

    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { complainsByUser },
    };
    res.status(200).json(successResponse);
  });

  public getAllComplainsByEvent = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { eventId } = req.params;
    if (!eventId) return next(new AppError('Provide eventId in the params', 400));
    const complainsByEvent = await this.complainService.getComplaintsByEvent(req, next, Number(eventId));
    if (!complainsByEvent) return next(new AppError(errorMessage('error.emptyComplainsForUser'), 404));

    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { complainsByEvent },
    };
    res.status(200).json(successResponse);
  });

  public CreateComplain = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const userId: number = req.normalUserFromReq?.id || req.body.userId;
    const data: CreateComplainDto = req.body;
    if (!data) return next(new AppError('Provide Appropiate data in the Body', 400));
    const complain = await this.complainService.createComplain({ ...data, userId }, next);
    if (!complain) return next(new AppError('Some thing goes wrong while Creating new Complain', 400));

    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { complain },
    };
    res.status(200).json(successResponse);
  });
}

export default new EventTypeController(complainService);
