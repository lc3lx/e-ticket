import { NextFunction } from 'express';
import AppError from '../utils/AppError'; // adjust path if needed

interface ParsedDateRange {
  startDate?: Date;
  endDate?: Date;
}

export const parseDateRange = (
  data: { startDate?: string; endDate?: string },
  next: NextFunction,
): ParsedDateRange | void => {
  let startDate: Date | undefined;
  let endDate: Date | undefined;

  if (data.startDate) {
    const parsed = new Date(data.startDate);
    if (isNaN(parsed.getTime())) {
      return next(new AppError('Invalid startDate format. Use ISO string or YYYY-MM-DD.', 400));
    }
    startDate = parsed;
  }

  if (data.endDate) {
    const parsed = new Date(data.endDate);
    if (isNaN(parsed.getTime())) {
      return next(new AppError('Invalid endDate format. Use ISO string or YYYY-MM-DD.', 400));
    }
    parsed.setHours(23, 59, 59, 999); // include full day
    endDate = parsed;
  }

  return { startDate, endDate };
};
