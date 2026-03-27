import { Response, NextFunction } from 'express';
import { CustomRequest } from '../interfaces/auth/extendRequest.dto';
import FAQService, { FAQServiceClass } from '../services/FAQ.service';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';
import { DefaultSuccessResponse, defaultSuccessResponse } from '../common/messages/en/default.response.js';
import { UpdateFAQ } from '../interfaces/FAQ/updateFAQ.dto';
import { errorMessage } from '../modules/i18next.config';

class FAQController {
  private FAQService: FAQServiceClass;

  constructor(FAQService: FAQServiceClass) {
    this.FAQService = FAQService;
  }

  public createFAQ = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const newFAQ = await this.FAQService.createFAQ(req.body, next);
    if (!newFAQ) return next(new AppError(errorMessage('error.FAQCreationFailed'), 400));

    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { newFAQ },
    };
    res.status(201).json(successResponse);
  });

  public getAllFAQ = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    let userType: 'normalUser' | 'supervisor' | null = null;
    if (req.normalUserFromReq) userType = 'normalUser';
    if (req.supervisorFromReq) userType = 'supervisor';
    // else userType = null;
    console.log(req.normalUserFromReq);
    console.log(req.supervisorFromReq?.username);
    const allEventTypes = await this.FAQService.getAllFAQs(userType, next);
    if (!allEventTypes) return next(new AppError(errorMessage('error.noFAQsFound'), 404));

    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { allEventTypes },
    };
    res.status(200).json(successResponse);
  });

  public getOneFAQ = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { FAQId } = req.params;
    const faq = await this.FAQService.getFAQById(Number(FAQId), next);
    if (!faq) return next(new AppError(errorMessage('error.FAQNotFound'), 404));

    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { faq },
    };
    res.status(200).json(successResponse);
  });

  public updateFAQ = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const id = req.params.FAQId;
    const allowedFields: (keyof UpdateFAQ)[] = ['question', 'answer'];
    const data = allowedFields.reduce((acc, field) => {
      if (req.body[field]) {
        acc[field] = req.body[field];
      }
      return acc;
    }, {} as Partial<UpdateFAQ>);

    if (Object.keys(data).length === 0) {
      return next(new AppError('No valid fields provided to update.', 400));
    }
    const updateData = { id: Number(id), ...data };
    // const data: UpdateFAQ = { id, ...req.body };
    const updatedFAQ = await this.FAQService.updateFAQ(updateData, next);
    if (!updatedFAQ) return next(new AppError(errorMessage('error.FAQUpdateFailed'), 400));

    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { updatedFAQ },
    };
    res.status(200).json(successResponse);
  });

  public moveUpFAQ = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { FAQId } = req.params;
    const movedFAQ = await this.FAQService.moveFAQUp(Number(FAQId), next);
    if (!movedFAQ) return next(new AppError(errorMessage('error.FAQMoveUpFailed'), 400));

    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { movedFAQ },
    };
    res.status(200).json(successResponse);
  });

  public moveDownFAQ = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { FAQId } = req.params;
    const movedFAQ = await this.FAQService.moveFAQDown(Number(FAQId), next);
    if (!movedFAQ) return next(new AppError(errorMessage('error.FAQMoveDownFailed'), 400));

    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { movedFAQ },
    };
    res.status(200).json(successResponse);
  });

  public deleteFAQ = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { FAQId } = req.params;
    const deleted = await this.FAQService.deleteFAQ(Number(FAQId), next);
    if (!deleted) return next(new AppError(errorMessage('error.FAQDeleteFailed'), 400));

    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      message: 'FAQ deleted successfully',
    };
    res.status(204).json(successResponse);
  });
}

export default new FAQController(FAQService);
