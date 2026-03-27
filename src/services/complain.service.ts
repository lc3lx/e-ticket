import { NextFunction } from 'express';
import Complain from '../models/complain.model.js';
import { Sequelize, Transaction } from 'sequelize';
import NormalUser from '../models/normalUser.model.js';
import User from '../models/user.model.js';
import Event from '../models/event.model.js';
import ComplainType from '../models/complaintType.model.js';
import { Supervisor } from '../models/supervisor.model.js';
import { CreateComplainDto } from '../interfaces/complain/createComplain.dto.js';
import AppError from '../utils/AppError.js';
import validateFieldsNames from '../utils/validateFields.js';
import { validateForeignKey } from '../utils/validateForeignKey.js';
import APIFeatures from '../utils/apiFeatures.js';
import catchAsyncReqNext from '../utils/catchAsyncReqNext.js';
import catchAsyncService from '../utils/catchAsyncService.js';
import { errorMessage } from '../modules/i18next.config';

export class ComplainService {
  private sequelize: Sequelize;

  constructor(sequelize: Sequelize) {
    this.sequelize = sequelize;
  }

  public createComplain = catchAsyncService(async (data: CreateComplainDto, next: NextFunction) => {
    const { complainTypeId, customComplain, userId, eventId } = data;
    // if (!complainTypeId || !customComplain || !userId || !eventId) return next(new AppError('missing data', 400));

    if (complainTypeId) {
      const complainType = await ComplainType.findByPk(complainTypeId);
      if (!complainType) return next(new AppError('Invalid Complain Type', 400));
    }
    const acceptedFields: string[] = [...this.allowedCreateComplainFields];
    const isAllowed = validateFieldsNames(acceptedFields, Object.keys(data));
    if (isAllowed !== true) {
      return next(
        new AppError(
          `${isAllowed.length === 1 ? 'this field is' : 'these fields are'} not allowed:
          ${isAllowed.join(', ')}`,
          400,
        ),
      );
    }
    if (!(await validateForeignKey(NormalUser, data.userId, 'NormalUser')))
      return next(new AppError('Invalid userId', 400));
    if (!(await validateForeignKey(Event, data.eventId, 'Event'))) return next(new AppError('Invalid eventId', 400));
    if (!(await validateForeignKey(ComplainType, data.complainTypeId, 'ComplainType')))
      return next(new AppError('Invalid complainTypeId', 400));

    const existComplain = await Complain.findOne({ where: { userId, eventId } });

    if (existComplain) return next(new AppError(errorMessage('error.duplicateComplain'), 400));

    const complaintType = await ComplainType.findByPk(data.complainTypeId);

    if (complaintType?.complaintName === 'Other' && !data.customComplain)
      return next(new AppError(errorMessage('error.emptyComplainsOtherType'), 400));
    if (complaintType?.complaintName !== 'Other' && data.customComplain)
      return next(new AppError('You cannot write on Typed Complain', 400));

    const complain = await Complain.create(
      {
        userId,
        eventId,
        complainTypeId,
        customComplain,
      },
      { validate: true },
    );
    return complain;
  });

  public getComplaintsByEvent = catchAsyncReqNext(async (req, next: NextFunction, eventId: number) => {
    const includeOptions = [
      {
        model: Event,
        as: 'event',
        include: [{ model: Supervisor, as: 'supervisor', include: [{ model: User, as: 'user' }] }],
      },
      { model: ComplainType, as: 'complainType' },
      { model: NormalUser, as: 'user', include: [{ model: User, as: 'user' }] },
    ];
    const features = new APIFeatures(Complain, req.query as unknown as Record<string, string>, {
      include: includeOptions,
      where: { eventId },
    })
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const totalCount = await Complain.count({
      where: features.query.where,
      include: includeOptions,
    });
    const complaints = await features.execute();
    if (!complaints) return next(new AppError(errorMessage('error.emptyComplainsForEvent'), 404));

    const totalPages = Math.ceil(totalCount / features.limit);
    const totalItemsInPage = complaints.length;
    const hasPreviousPage = features.page > 1;
    const hasNextPage = features.page < totalPages;

    return {
      page: features.page,
      totalPages,
      totalItemsInPage,
      limit: features.limit,
      totalCount,
      data: complaints,
      hasPreviousPage,
      hasNextPage,
    };
  });

  public readComplain = catchAsyncService(async (complainId: number, next: NextFunction) => {
    const transaction = await this.sequelize.transaction();
    const complaint = await Complain.findByPk(complainId, { transaction });
    if (!complaint) return next(new AppError('complaint not found', 404));
    complaint.isReaded = true;
    await complaint.validate();
    await complaint.save({ transaction });
    await transaction.commit();

    return complaint;
  });

  public getComplaintsByUser = catchAsyncReqNext(async (req, next: NextFunction, userId: number) => {
    const includeOptions = [
      {
        model: Event,
        as: 'event',
        include: [{ model: Supervisor, as: 'supervisor', include: [{ model: User, as: 'user' }] }],
      },
      { model: ComplainType, as: 'complainType' },
      { model: NormalUser, as: 'user', include: [{ model: User, as: 'user' }] },
      // { model: User, as: 'user' },
    ];
    const features = new APIFeatures(Complain, req.query as unknown as Record<string, string>, {
      include: includeOptions,
      where: { userId },
    })
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const totalCount = await Complain.count({
      where: features.query.where,
      include: includeOptions,
    });

    const complaints = await features.execute();

    if (!complaints) return next(new AppError(errorMessage('error.emptyComplainsForUser'), 404));

    const totalPages = Math.ceil(totalCount / features.limit);
    const totalItemsInPage = complaints.length;
    const hasPreviousPage = features.page > 1;
    const hasNextPage = features.page < totalPages;

    return {
      page: features.page,
      totalPages,
      totalItemsInPage,
      limit: features.limit,
      totalCount,
      data: complaints,
      hasPreviousPage,
      hasNextPage,
    };
  });

  public getAllComplaints = catchAsyncReqNext(async (req, next: NextFunction) => {
    const includeOptions = [
      {
        model: Event,
        as: 'event',
        include: [{ model: Supervisor, as: 'supervisor', include: [{ model: User, as: 'user' }] }],
      },
      { model: ComplainType, as: 'complainType' },
      { model: NormalUser, as: 'user', include: [{ model: User, as: 'user' }] },
    ];
    const features = new APIFeatures(Complain, req.query as unknown as Record<string, string>, {
      include: includeOptions,
    })
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const totalCount = await Complain.count({
      where: features.query.where,
      include: includeOptions,
    });
    const complaints = await features.execute();
    if (!complaints) return next(new AppError(errorMessage('error.emptyComplains'), 404));

    const totalPages = Math.ceil(totalCount / features.limit);
    const totalItemsInPage = complaints.length;
    const hasPreviousPage = features.page > 1;
    const hasNextPage = features.page < totalPages;

    return {
      page: features.page,
      totalPages,
      totalItemsInPage,
      limit: features.limit,
      totalCount,
      data: complaints,
      hasPreviousPage,
      hasNextPage,
    };
  });

  private allowedCreateComplainFields = ['complainTypeId', 'customComplain', 'userId', 'eventId'];
}

import { sequelize } from '../DB/sequelize.js';
export default new ComplainService(sequelize);
