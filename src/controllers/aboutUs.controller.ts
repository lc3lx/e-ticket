import { Request, Response, NextFunction } from 'express';
import aboutUsService, { AboutUsService } from '../services/aboutUs.service.js';
import catchAsync from '../utils/catchAsync.js';
import { CreateOrUpdateAboutUs } from '../interfaces/aboutUs/createOrUpdateAboutUs.dto.js';
import AppError from '../utils/AppError.js';
import { DefaultSuccessResponse, defaultSuccessResponse } from '../common/messages/en/default.response';

class PrivacyPolicyController {
  private aboutUsService: AboutUsService;

  constructor(aboutUsService: AboutUsService) {
    this.aboutUsService = aboutUsService;
  }

  public getAboutUs = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const lang = req.headers['accept-language'] === 'ar';
    const aboutUs = await this.aboutUsService.getAboutUs(lang, next);
    if (!aboutUs) return next(new AppError('about us not found', 404));

    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { aboutUs },
    };
    res.status(200).json(successResponse);
  });

  public createOrUpdateAboutUs = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const data: CreateOrUpdateAboutUs = req.body;
    const aboutUs = await this.aboutUsService.saveAboutUs(data, next);
    if (!aboutUs) return next(new AppError('About Us not found', 404));

    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { aboutUs },
    };
    res.status(200).json(successResponse);
  });
}

export default new PrivacyPolicyController(aboutUsService);
