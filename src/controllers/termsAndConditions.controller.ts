import { Request, Response, NextFunction } from 'express';
import termsAndConditionsService, { TermsAndConditionsService } from '../services/termsAndConditions.service.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';
import { DefaultSuccessResponse, defaultSuccessResponse } from '../common/messages/en/default.response';

class PrivacyPolicyController {
  private termsAndConditionsService: TermsAndConditionsService;

  constructor(termsAndConditionsService: TermsAndConditionsService) {
    this.termsAndConditionsService = termsAndConditionsService;
  }

  public getTermsAndConditions = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const lang = req.headers['accept-language'] === 'ar';

    const terms = await this.termsAndConditionsService.getTermsAndConditions(lang, next);
    if (!terms) return next(new AppError('Terms And Conditions not found', 404));

    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { terms },
    };
    res.status(200).json(successResponse);
  });

  public createOrUpdateTermsAndConditions = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { content, language } = req.body;
    const data = { content, language };
    const terms = await this.termsAndConditionsService.saveTermsAndConditions(data, next);
    if (!terms) return next(new AppError('Terms And Conditions not found', 404));

    const successResponse: DefaultSuccessResponse = {
      ...defaultSuccessResponse(),
      data: { terms },
    };
    res.status(200).json(successResponse);
  });
}

export default new PrivacyPolicyController(termsAndConditionsService);
