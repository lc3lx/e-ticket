import { NextFunction } from 'express';
import { Sequelize, Transaction } from 'sequelize';
import FAQ from '../models/FAQ.model.js';
import AppError from '../utils/AppError.js';
import catchAsyncService from '../utils/catchAsyncService.js';
import catchAsyncNext from '../utils/catchAsyncNextOnly.js';
import { CreateFAQ } from '../interfaces/FAQ/createFAQ.dto.js';
import { UpdateFAQ } from '../interfaces/FAQ/updateFAQ.dto.js';

export class FAQServiceClass {
  private sequelize: Sequelize;

  constructor(sequelize: Sequelize) {
    this.sequelize = sequelize;
  }

  public createFAQ = catchAsyncService(async (data: CreateFAQ, next: NextFunction) => {
    const transaction = await this.sequelize.transaction();
    const maxOrder = Number((await FAQ.max('order', { transaction })) || 0);
    const newFAQ = await FAQ.create(
      {
        question: data.question,
        answer: data.answer,
        order: maxOrder + 1,
        userType: data.userType,
      },
      { transaction, validate: true },
    );
    if (!newFAQ) {
      await transaction.rollback();
      return next(new AppError('cannot create this FAQ', 400));
    }
    await transaction.commit();
    return newFAQ;
  });

  public getAllFAQs = catchAsyncService(async (userType: 'normalUser' | 'supervisor' | null, next: NextFunction) => {
    let whereOption = {};
    if (userType !== null) whereOption = { userType };
    const faqs = await FAQ.findAll({ order: [['order', 'ASC']], where: whereOption });
    if (!faqs) return next(new AppError('cannot find any question', 404));
    const faqsWithMovement = faqs.map((faq, index, array) => {
      const canMoveUp = index > 0 && array[index - 1].order < faq.order;
      const canMoveDown = index < array.length - 1 && array[index + 1].order > faq.order;
      return {
        ...faq.get({ plain: true }),
        canMoveUp,
        canMoveDown,
      };
    });
    return faqsWithMovement;
  });

  public getFAQById = catchAsyncService(async (id: number, next: NextFunction) => {
    const faq = await FAQ.findByPk(id);
    if (!faq) {
      return next(new AppError(`FAQ with ID ${id} not found`, 404));
    }
    return faq;
  });

  public updateFAQ = catchAsyncService(async (data: UpdateFAQ, next: NextFunction) => {
    const transaction = await this.sequelize.transaction();
    const faq = await FAQ.findByPk(data.id, { transaction });
    if (!faq) {
      await transaction.rollback();
      return next(new AppError(`FAQ with ID ${data.id} not found`, 404));
    }
    const { id, ...updateData } = data;
    await faq.update(updateData, { transaction, validate: true });
    await transaction.commit();
    return faq;
  });

  public moveFAQUp = catchAsyncService(async (id: number, next: NextFunction) => {
    const transaction = await this.sequelize.transaction();
    const faq = await FAQ.findByPk(id, { transaction });
    if (!faq) {
      await transaction.rollback();
      return next(new AppError(`FAQ with ID ${id} not found`, 404));
    }
    const previousFAQ = await FAQ.findOne({
      where: { order: faq.order - 1 },
      transaction,
    });

    if (!previousFAQ) {
      await transaction.rollback();
      return next(new AppError('This FAQ is already at the top', 400));
    }
    await faq.update({ order: faq.order - 1 }, { transaction });
    await previousFAQ.update({ order: previousFAQ.order + 1 }, { transaction });
    await transaction.commit();
    return faq;
  });

  public moveFAQDown = catchAsyncService(async (id: number, next: NextFunction) => {
    const transaction = await this.sequelize.transaction();
    const faq = await FAQ.findByPk(id, { transaction });
    if (!faq) {
      await transaction.rollback();
      return next(new AppError(`FAQ with ID ${id} not found`, 404));
    }
    const nextFAQ = await FAQ.findOne({
      where: { order: faq.order + 1 },
      transaction,
    });
    if (!nextFAQ) {
      await transaction.rollback();
      return next(new AppError('This FAQ is already at the bottom', 400));
    }
    await faq.update({ order: faq.order + 1 }, { transaction });
    await nextFAQ.update({ order: nextFAQ.order - 1 }, { transaction });
    await transaction.commit();
    return faq;
  });

  public deleteFAQ = catchAsyncService(async (id: number, next: NextFunction) => {
    const transaction = await this.sequelize.transaction();
    const faq = await FAQ.findByPk(id, { transaction });
    if (!faq) {
      await transaction.rollback();
      return next(new AppError(`FAQ with ID ${id} not found`, 404));
    }
    await faq.destroy({ transaction });
    await this.normalizeOrder(transaction);
    await transaction.commit();
    return true;
  });

  private normalizeOrder = async (transaction: Transaction) => {
    const faqs = await FAQ.findAll({
      order: [['order', 'ASC']],
      transaction,
    });

    for (let i = 0; i < faqs.length; i += 1) {
      await faqs[i].update({ order: i + 1 }, { transaction });
    }
  };
}

import { sequelize } from '../DB/sequelize.js';
export default new FAQServiceClass(sequelize);
