import { Response, NextFunction } from 'express';
import { CustomRequest } from '../interfaces/auth/extendRequest.dto';
import complaintTypeService, { ComplaintTypeService } from '../services/complaintType.service';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';
import { DefaultSuccessResponse, defaultSuccessResponse } from '../common/messages/en/default.response.js';
import { errorMessage } from '../modules/i18next.config';
import { UpdateComplainTypeDto } from '../interfaces/complain/updateComplainType.dto';

class ComplainTypeController {
  private complaintTypeService: ComplaintTypeService;

  constructor(complaintTypeService: ComplaintTypeService) {
    this.complaintTypeService = complaintTypeService;
  }

  public getAllComplainTypes = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const allComplainTypes = await this.complaintTypeService.getAllComplaintTypes(next);
    if (!allComplainTypes) return next(new AppError(errorMessage('error.emptyComplainTypes'), 404));

    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { allComplainTypes },
    };
    res.status(200).json(successResponse);
  });

  public createComplainType = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { complaintName } = req.body;
    if (!complaintName) return next(new AppError('missing complain name', 404));

    const newComplain = await this.complaintTypeService.addNewComplainType(complaintName, next);
    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { newComplain },
    };
    res.status(201).json(successResponse);
  });

  public updateComplainType = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const updateDate: UpdateComplainTypeDto = req.body;
    if (!updateDate.complaintName || !updateDate.id) return next(new AppError('missing complain name or id', 404));

    const updatedComplainType = await this.complaintTypeService.updateComplainType(updateDate, next);
    if (!updatedComplainType) return next(new AppError(errorMessage('error complain type not found'), 404));
    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { updatedComplainType },
    };
    res.status(200).json(successResponse);
  });

  public deleteComplainType = catchAsync(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { complainTypeId } = req.body;
    if (!complainTypeId) return next(new AppError('missing complainTypeId', 400));
    const deletedComplainType = await this.complaintTypeService.deleteComplainType(complainTypeId, next);

    if (deletedComplainType) res.status(204).json({});
  });
}

export default new ComplainTypeController(complaintTypeService);
