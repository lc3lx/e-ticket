import { NextFunction } from 'express';
import Rating from '../models/rateEvent.model.js';
import { Sequelize } from 'sequelize';
import catchAsyncService from '../utils/catchAsyncService.js';
import AppError from '../utils/AppError.js';
import bookTicketService from './bookTicket.service.js';

class RateEventService {
  private sequelize: Sequelize;

  constructor(sequelize: Sequelize) {
    this.sequelize = sequelize;
  }

  public rateEvent = catchAsyncService(
    async (data: { userId: number; eventId: number; ratingValue: number }, next: NextFunction) => {
      const { userId, eventId, ratingValue } = data;

      if (!bookTicketService.allUserBooking) return next(new AppError('error.nonauthorized', 401));

      if (ratingValue < 0 || ratingValue > 5) {
        return next(new AppError('error.rateEventValues', 400));
      }

      const [rating, created] = await Rating.upsert(
        {
          userId,
          eventId,
          rating: ratingValue,
        },
        {
          returning: true,
        },
      );

      return { rating, created };
    },
  );

  public getAverageRating = catchAsyncService(async (eventId: number) => {
    const result = (await Rating.findOne({
      where: { eventId },
      attributes: [
        [this.sequelize.fn('AVG', Sequelize.col('rating')), 'avgRating'],
        [this.sequelize.fn('COUNT', Sequelize.col('rating')), 'count'],
      ],
      raw: true,
    })) as unknown as { avgRating: string | null; count: string | null };

    return {
      averageRating: (Math.round(parseFloat(result?.avgRating || '0')) * 2) / 2,
      totalRatings: parseInt(result?.count || '0'),
    };
  });

  public getUserRating = catchAsyncService(async (data: { userId: number; eventId: number }, next: NextFunction) => {
    const { userId, eventId } = data;
    return Rating.findOne({
      where: { userId, eventId },
    });
  });

  public deleteRating = catchAsyncService(async (data: { userId: number; eventId: number }, next: NextFunction) => {
    const { userId, eventId } = data;
    const deleted = await Rating.destroy({
      where: { userId, eventId },
    });
    return deleted > 0;
  });
}

import { sequelize } from '../DB/sequelize.js';
export default new RateEventService(sequelize);
