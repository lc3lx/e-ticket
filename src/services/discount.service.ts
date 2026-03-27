import { NextFunction } from 'express';
import { CustomRequest } from '../interfaces/auth/extendRequest.dto';
import DiscountCode from '../models/discountCode.model.js';
import Event from '../models/event.model.js';
import { Sequelize, Transaction } from 'sequelize';
import APIFeatures from '../utils/apiFeatures';
import catchAsyncService from '../utils/catchAsyncService.js';
import catchAsyncReqNext from '../utils/catchAsyncReqNext';
import AppError from '../utils/AppError.js';
import { errorMessage } from '../modules/i18next.config.js';

interface CreateDiscountCodeInput {
  code: string;
  isPercent: boolean;
  isFixedValue: boolean;
  value: number;
  eventId: number;
  startFrom: Date;
  endAt: Date;
  isDisabled?: boolean;
  usageLimit: number;
  usageCount?: number;
}

interface UpdateDiscountCodeInput {
  id?: number;
  code?: string;
  isPercent?: boolean;
  isFixedValue?: boolean;
  value?: number;
  eventId?: number;
  startFrom?: Date;
  endAt?: Date;
  isDisabled?: boolean;
  usageLimit?: number;
}

class DiscountCodeService {
  private sequelize: Sequelize;

  constructor(sequelize: Sequelize) {
    this.sequelize = sequelize;
  }

  public createDiscountCode = catchAsyncService(async (data: CreateDiscountCodeInput, next: NextFunction) => {
    const event = await Event.findByPk(data.eventId);
    if (!event) {
      return next(new AppError(errorMessage('error.eventNotFound'), 404));
    }
    const discountCode = await DiscountCode.create({
      ...data,
      isDisabled: data.isDisabled ?? false,
      usageLimit: data.usageLimit ?? null,
      usageCount: 0,
    });
    return discountCode;
  });

  public getAllDiscountCodes = catchAsyncReqNext(async (req: CustomRequest, next: NextFunction) => {
    const includeOptions = [{ model: Event, as: 'event' }];
    // const transaction = await this.sequelize.transaction();
    const features = new APIFeatures(DiscountCode, req.query as unknown as Record<string, string>, {
      include: includeOptions,
      // transaction,
    })
      .filter()
      .sort()
      .limitFields()
      .paginate()
      .search();

    const totalCount = await DiscountCode.count({
      where: features.query.where,
      include: includeOptions,
      // transaction,
    });
    const allCodes = await features.execute();

    if (!allCodes) {
      // await transaction.rollback();
      return next(new AppError(errorMessage('error.eventsNotFound'), 404));
    }

    // await transaction.commit();
    const totalPages = Math.ceil(totalCount / features.limit);
    const totalItemsInPage = allCodes.length;
    const hasPreviousPage = features.page > 1;
    const hasNextPage = features.page < totalPages;
    return {
      page: features.page,
      totalPages,
      totalItemsInPage,
      limit: features.limit,
      totalCount,
      data: allCodes,
      hasPreviousPage,
      hasNextPage,
    };
  });

  public getDiscountCodeById = catchAsyncService(async (id: number, next: NextFunction) => {
    const discountCode = await DiscountCode.findByPk(id);
    if (!discountCode) {
      return next(new AppError(errorMessage('error.discountCodeNotFound'), 404));
    }
    return discountCode;
  });

  public updateDiscountCode = catchAsyncService(async (data: UpdateDiscountCodeInput, next: NextFunction) => {
    const discountCode = await DiscountCode.findByPk(data.id);
    if (!discountCode) {
      return next(new AppError(errorMessage('error.discountCodeNotFound'), 404));
    }

    if (data.eventId) {
      const event = await Event.findByPk(data.eventId);
      if (!event) {
        return next(new AppError(errorMessage('error.eventNotFound'), 404));
      }
    }
    await discountCode.update(data, { validate: true });
    return discountCode.reload();
  });

  public deleteDiscountCode = catchAsyncService(async (id: number, next: NextFunction) => {
    const discountCode = await DiscountCode.findByPk(id);
    if (!discountCode) {
      return next(new AppError(errorMessage('error.discountCodeNotFound'), 404));
    }
    await discountCode.destroy();
    return true;
  });

  public getDiscountInfo = catchAsyncService(
    async ({ discountCode, eventId }: { discountCode: string; eventId: number }, next: NextFunction) => {
      const discount = await DiscountCode.findOne({ where: { eventId, code: discountCode } });
      if (!discount) return next(new AppError(errorMessage('error.discountNotFound'), 404));

      const event = await Event.findByPk(eventId);
      if (!event) return next(new AppError(errorMessage('error.eventNotFound'), 404));

      const ticketOptionsAndPrices = this.normalizeTicketOptionsAndPrices(event.ticketOptionsAndPrices);

      const ticketOptions = event.ticketOptionsAndPrices;
      let vipOldPrice, classicOldPrice, economyOldPrice;
      let vipNewPrice, classicNewPrice, economyNewPrice;

      if (ticketOptionsAndPrices.VIP?.price) {
        vipOldPrice = ticketOptionsAndPrices.VIP.price;
        vipNewPrice = discount.isFixedValue
          ? vipOldPrice - discount.value
          : (vipOldPrice * (100 - discount.value)) / 100;
      }

      if (ticketOptionsAndPrices.Classic?.price) {
        classicOldPrice = ticketOptionsAndPrices.Classic.price;
        classicNewPrice = discount.isFixedValue
          ? classicOldPrice - discount.value
          : (classicOldPrice * (100 - discount.value)) / 100;
      }

      if (ticketOptionsAndPrices.Economy?.price) {
        economyOldPrice = ticketOptionsAndPrices.Economy.price;
        economyNewPrice = discount.isFixedValue
          ? economyOldPrice - discount.value
          : (economyOldPrice * (100 - discount.value)) / 100;
      }
      const prices = {};
      if (vipOldPrice) Object.assign(prices, { vip: { vipOldPrice, vipNewPrice } });
      if (classicOldPrice) Object.assign(prices, { classic: { classicOldPrice, classicNewPrice } });
      if (economyOldPrice) Object.assign(prices, { economy: { economyOldPrice, economyNewPrice } });

      return prices;
    },
  );

  private normalizeTicketOptionsAndPrices(raw: Record<string, any>) {
    return {
      VIP: raw.vip,
      Classic: raw.classic,
      Economy: raw.economy,
    };
  }
}

import { sequelize } from '../DB/sequelize.js';
export default new DiscountCodeService(sequelize);
