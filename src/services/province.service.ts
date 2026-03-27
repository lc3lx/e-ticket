import { NextFunction } from 'express';
import { Sequelize, Transaction } from 'sequelize';
import Province from '../models/provinces.model';
import catchAsyncNext from '../utils/catchAsyncNextOnly.js';
import AppError from '../utils/AppError.js';
import { errorMessage } from '../modules/i18next.config';

export class ProvinceService {
  private sequelize: Sequelize;

  constructor(sequelize: Sequelize) {
    this.sequelize = sequelize;
  }

  public getAllProvinces = catchAsyncNext(async (next: NextFunction) => {
    const allProvinces = await Province.findAll();
    if (!allProvinces) return next(new AppError(errorMessage('error.provincesNotFound'), 404));

    return allProvinces;
  });
}

import { sequelize } from '../DB/sequelize.js';
export default new ProvinceService(sequelize);
