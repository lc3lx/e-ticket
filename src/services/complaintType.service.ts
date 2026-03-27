import { NextFunction } from 'express';
import { Sequelize, Transaction, Op } from 'sequelize';
import AppError from '../utils/AppError.js';
import catchAsyncService from '../utils/catchAsyncService.js';
import catchAsyncNext from '../utils/catchAsyncNextOnly.js';
import ComplaintType from '../models/complaintType.model.js';
import { errorMessage } from '../modules/i18next.config';
import { UpdateComplainTypeDto } from '../interfaces/complain/updateComplainType.dto.js';

export class ComplaintTypeService {
  private sequelize: Sequelize;

  constructor(sequelize: Sequelize) {
    this.sequelize = sequelize;
  }

  public getAllComplaintTypes = catchAsyncNext(async (next: NextFunction) => {
    const complainTypes = await ComplaintType.findAll({ attributes: ['id', 'complaintName'] });
    if (!complainTypes) return next(new AppError(errorMessage('error.emptyComplainTypes'), 400));
    return complainTypes;
  });

  public addNewComplainType = catchAsyncService(async (complainTypeName: string, next: NextFunction) => {
    if (!complainTypeName) return next(new AppError('missing complaint name', 400));
    const complaintName = complainTypeName;
    const complainType = await ComplaintType.create({ complaintName }, { validate: true });
    return complainType;
  });

  public updateComplainType = catchAsyncService(
    async (updateComplainTypeDate: UpdateComplainTypeDto, next: NextFunction) => {
      const transaction = await this.sequelize.transaction();
      const updatedComplainType = await ComplaintType.findOne({
        where: { id: updateComplainTypeDate.id, complaintName: { [Op.ne]: 'Other' } },
        transaction,
      });
      if (!updatedComplainType) {
        await transaction.rollback();
        return next(new AppError('cannot find complain type', 404));
      }
      updatedComplainType.complaintName = updateComplainTypeDate.complaintName;
      await updatedComplainType.validate();
      await updatedComplainType.save({ transaction });
      await transaction.commit();

      return updatedComplainType;
    },
  );

  public deleteComplainType = catchAsyncService(async (complainTypeId: number, next: NextFunction) => {
    const deletedComplainType = await ComplaintType.destroy({ where: { id: complainTypeId } });
    return deletedComplainType;
  });
}

import { sequelize } from '../DB/sequelize.js';
export default new ComplaintTypeService(sequelize);
