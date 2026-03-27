import { Request, Response, NextFunction } from 'express';
import privacyPolicyService, { PrivacyPolicyService } from '../services/privacyPolicy.service.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';
import { DefaultSuccessResponse, defaultSuccessResponse } from '../common/messages/en/default.response';

class PrivacyPolicyController {
  private privacyPolicyService: PrivacyPolicyService;

  constructor(privacyPolicyService: PrivacyPolicyService) {
    this.privacyPolicyService = privacyPolicyService;
  }

  public getPrivacyPolicy = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const lang = req.headers['accept-language'] === 'ar';
    const policy = await this.privacyPolicyService.getPrivacyPolicy(lang, next);
    if (!policy) return next(new AppError('privacy Policy not found', 404));

    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { policy },
    };
    res.status(200).json(successResponse);
  });

  public createOrUpdatePrivacyPolicy = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { content, language } = req.body;
    const data = { content, language };
    const policy = await this.privacyPolicyService.savePrivacyPolicy(data, next);
    if (!policy) return next(new AppError('privacy Policy not found', 404));

    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { policy },
    };
    res.status(200).json(successResponse);
  });
}

export default new PrivacyPolicyController(privacyPolicyService);
