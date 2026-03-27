import { NextFunction } from 'express';
import { Sequelize, Transaction } from 'sequelize';
import AboutUs from '../models/aboutUs.model.js';
import AboutUsTranslation from '../models/aboutUSContent.model.js';
import catchAsyncService from '../utils/catchAsyncService.js';
import AppError from '../utils/AppError.js';
import { CreateOrUpdateAboutUs } from '../interfaces/aboutUs/createOrUpdateAboutUs.dto.js';
import { errorMessage } from '../modules/i18next.config';
import validateFieldsNames from '../utils/validateFields.js';

export class AboutUsService {
  private sequelize: Sequelize;

  constructor(sequelize: Sequelize) {
    this.sequelize = sequelize;
  }

  public getAboutUs = catchAsyncService(async (lang: boolean, next: NextFunction) => {
    let language = 'en';
    if (lang) language = 'ar';
    const about = await AboutUs.findOne({
      include: [{ model: AboutUsTranslation, as: 'translations', required: false, where: { language } }],
    });
    if (!about) return next(new AppError(errorMessage('error.about us not found'), 404));

    return about;
  });

  public saveAboutUs = catchAsyncService(async (data: CreateOrUpdateAboutUs, next: NextFunction) => {
    const transaction = await this.sequelize.transaction();
    const existingAboutUs = await AboutUs.findOne({
      transaction,
      include: [{ model: AboutUsTranslation, as: 'translations', required: false, where: { language: data.language } }],
    });
    const isAllowed = validateFieldsNames(this.acceptedFields, Object.keys(data));
    if (isAllowed !== true) {
      return next(
        new AppError(
          `${isAllowed.length === 1 ? 'this field is' : 'these fields are'} not allowed:
          ${isAllowed.join(', ')}`,
          400,
        ),
      );
    }

    if (!data.content || !data.language) return next(new AppError('Content and language are required.', 400));

    if (existingAboutUs) {
      if (data.callCenterMobileNumber) existingAboutUs.callCenterMobileNumber = data.callCenterMobileNumber;
      if (data.email) existingAboutUs.email = data.email;
      if (data.callCenterTelePhoneLineNumber)
        existingAboutUs.callCenterTelePhoneLineNumber = data.callCenterTelePhoneLineNumber;
      if (data.website) existingAboutUs.website = data.website;
      await existingAboutUs.validate();
      await existingAboutUs.save({ transaction });

      const [translation, created] = await AboutUsTranslation.findOrCreate({
        where: { aboutUsId: existingAboutUs.id, language: data.language },
        defaults: { content: data.content, language: data.language, aboutUsId: existingAboutUs.id },
        transaction,
      });

      if (!created) {
        translation.content = data.content;
        await translation.save({ transaction });
      }

      await transaction.commit();
      await existingAboutUs.reload();
      return existingAboutUs;
    }
    if (!data.content) {
      await transaction.rollback();
      return next(new AppError('error. you cannot leave the content empty.', 400));
    }

    if (!data.callCenterMobileNumber) {
      await transaction.rollback();
      return next(new AppError('error. you cannot leave call center number empty.', 400));
    }
    // if (!data.callCenterTelePhoneLineNumber){
    // await transaction.rollback();
    //   return next(new AppError('error. you cannot leave call center number empty.', 400));
    //}
    if (!data.email) {
      await transaction.rollback();
      return next(new AppError('error. you cannot leave the email empty.', 400));
    }
    if (!data.website) {
      await transaction.rollback();
      return next(new AppError('error. you cannot leave the webiste empty.', 400));
    }
    const newAboutUs = await AboutUs.create(
      {
        callCenterMobileNumber: data.callCenterMobileNumber,
        email: data.email,
        website: data.website,
        callCenterTelePhoneLineNumber: data.callCenterTelePhoneLineNumber || '',
      },
      { transaction, validate: true },
    );

    await AboutUsTranslation.create(
      {
        aboutUsId: newAboutUs.id,
        language: data.language,
        content: data.content,
      },
      { transaction },
    );

    await transaction.commit();

    const about = await AboutUs.findOne({
      include: [{ model: AboutUsTranslation, as: 'translations', required: false, where: { language: data.language } }],
    });
    if (!about) return next(new AppError(errorMessage('error.about us not found'), 404));

    return about;
  });

  private acceptedFields = [
    'content',
    'callCenterMobileNumber',
    'email',
    'language',
    'website',
    'callCenterTelePhoneLineNumber',
  ];
}

import { sequelize } from '../DB/sequelize.js';
export default new AboutUsService(sequelize);
