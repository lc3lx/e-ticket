import { Request, Response, NextFunction } from 'express';
import provinceService, { ProvinceService } from '../services/province.service';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';
import { DefaultSuccessResponse, defaultSuccessResponse } from '../common/messages/en/default.response';

class ProvinceController {
  private provinceService: ProvinceService;

  constructor(provinceService: ProvinceService) {
    this.provinceService = provinceService;
  }

  public getAllProvinces = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const allProvinces = await this.provinceService.getAllProvinces(next);
    if (!allProvinces) return next(new AppError('Provinces not founds', 404));

    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { allProvinces },
    };
    res.status(200).json(successResponse);
  });
}

export default new ProvinceController(provinceService);
