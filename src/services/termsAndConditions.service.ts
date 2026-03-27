import { NextFunction } from 'express';
import { Sequelize, Transaction } from 'sequelize';
import TermsAndConditions from '../models/termsAndConditions.model.js';
import catchAsyncNext from '../utils/catchAsyncNextOnly.js';
import catchAsyncService from '../utils/catchAsyncService.js';
import AppError from '../utils/AppError.js';
import { errorMessage } from '../modules/i18next.config';

export class TermsAndConditionsService {
  private sequelize: Sequelize;

  constructor(sequelize: Sequelize) {
    this.sequelize = sequelize;
  }

  public getTermsAndConditions = catchAsyncService(async (lang: boolean, next: NextFunction) => {
    let language = 'en';
    if (lang) language = 'ar';

    const terms = await TermsAndConditions.findOne({ where: { language } });
    if (!terms) return next(new AppError(errorMessage('error.terms and conditions not found'), 404));

    return terms;
  });

  public saveTermsAndConditions = catchAsyncService(
    async (data: { content: string; language: 'ar' | 'en' }, next: NextFunction) => {
      const existingterms = await TermsAndConditions.findOne({ where: { language: data.language } });

      if (existingterms) {
        existingterms.content = data.content;
        await existingterms.save();
        return existingterms;
      }
      const newterms = await TermsAndConditions.create(
        { content: data.content, language: data.language },
        { validate: true },
      );
      return newterms;
    },
  );
}

import { sequelize } from '../DB/sequelize.js';
export default new TermsAndConditionsService(sequelize);
