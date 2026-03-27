import { NextFunction } from 'express';
import { Sequelize, Transaction } from 'sequelize';
import PrivacyPolicy from '../models/privacyPolicy.model.js';
import catchAsyncNext from '../utils/catchAsyncNextOnly.js';
import catchAsyncService from '../utils/catchAsyncService.js';
import AppError from '../utils/AppError.js';
import { errorMessage } from '../modules/i18next.config';

export class PrivacyPolicyService {
  private sequelize: Sequelize;

  constructor(sequelize: Sequelize) {
    this.sequelize = sequelize;
  }

  public getPrivacyPolicy = catchAsyncService(async (lang: boolean, next: NextFunction) => {
    let language = 'en';
    if (lang) language = 'ar';

    const policy = await PrivacyPolicy.findOne({ where: { language } });
    if (!policy) return next(new AppError(errorMessage('error.privacy policy not found'), 404));

    return policy;
  });

  public savePrivacyPolicy = catchAsyncService(
    async (data: { content: string; language: 'en' | 'ar' }, next: NextFunction) => {
      const existingPolicy = await PrivacyPolicy.findOne({ where: { language: data.language } });

      if (existingPolicy) {
        existingPolicy.content = data.content;
        await existingPolicy.save();
        return existingPolicy;
      }
      const newPolicy = await PrivacyPolicy.create(
        { content: data.content, language: data.language },
        { validate: true },
      );
      return newPolicy;
    },
  );
}

import { sequelize } from '../DB/sequelize.js';
export default new PrivacyPolicyService(sequelize);
