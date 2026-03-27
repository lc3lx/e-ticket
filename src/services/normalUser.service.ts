import { NextFunction, Request } from 'express';
import { literal, Sequelize, Transaction, Op, WhereOptions } from 'sequelize';
import path from 'path';
import pathName from '../utils/serverAndPort.js';
import User from '../models/user.model';
import NormalUser from '../models/normalUser.model';
import EventType from '../models/eventType.model';
import Province from '../models/provinces.model';
import bookTicketService from './bookTicket.service';
import { UpdateUserDto } from '../interfaces/normalUser/updateUser.dto';
import AppError from '../utils/AppError.js';
import catchAsyncService from '../utils/catchAsyncService.js';
import catchAsyncCred from '../utils/catchAsyncWithCred.js';
import catchAsyncReqNext from '../utils/catchAsyncReqNext.js';
import upload from '../modules/multer.config';
import APIFeatures from '../utils/apiFeatures.js';
import { errorMessage } from '../modules/i18next.config';
import { CustomRequest } from '../interfaces/auth/extendRequest.dto';
import { sequelize } from '../DB/sequelize.js';
import { updateUserSchema } from '../modules/zodValidation/normalUser/updateNormalUser.config';
// import catchAsyncNext from '../utils/catchAsyncNextOnly.js';

interface UserStats {
  totalUsers: number;
  newUsers: {
    lastDay: number;
    lastWeek: number;
    lastMonth: number;
  };
}

export class NormalUserService {
  private sequelize: Sequelize;

  constructor(sequelize: Sequelize) {
    this.sequelize = sequelize;
  }

  public getUserProfileInfo = catchAsyncService(async (mobileNumber: string, next: NextFunction) => {
    // const transaction = await this.sequelize.transaction();
    const normalUser = await NormalUser.findOne({
      where: { mobileNumber: mobileNumber },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'lastLogin'],
        },
        { model: EventType, through: { attributes: [] }, as: 'eventTypes' },
        { model: Province, as: 'provinces', through: { attributes: [] } },
      ],
      attributes: ['id', 'mobileNumber', 'gender', 'birthDate', 'profilePicture'],
      // transaction,
    });
    if (!normalUser) {
      // await transaction.rollback();
      return next(new AppError(errorMessage('error.userNotFound'), 404));
    }
    // transaction.commit();

    const returnedNormalUser = {
      mobileNumber: normalUser.mobileNumber,
      firstName: normalUser.user?.firstName,
      lastName: normalUser.user?.lastName,
      gender: normalUser.gender,
      birthDate: normalUser.birthDate,
      interests: normalUser.eventTypes,
      provinces: normalUser.provinces,
      profilePicture: normalUser.profilePicture,
    };
    return returnedNormalUser;
  });

  public updateUserProfileInfo = catchAsyncCred(
    async (phoneNumber: string, data: UpdateUserDto, next: NextFunction) => {
      const transaction: Transaction = await this.sequelize.transaction();
      const { firstName, lastName, gender, birthDate, provinceIds, profilePicture } = data;
      let { eventTypeIds, mobileNumber } = data;

      const normalUser = await NormalUser.findOne({
        where: { mobileNumber: phoneNumber },
        include: [
          { model: User, as: 'user' },
          { model: EventType, through: { attributes: [] }, as: 'eventTypes' },
          { model: Province, as: 'provinces', through: { attributes: [] } },
        ],
        transaction,
      });
      if (!normalUser || !normalUser.user) {
        await transaction.rollback();
        return next(new AppError(errorMessage('error.userNotFound'), 404));
      }

      if (normalUser.mobileNumber && normalUser.mobileNumber === mobileNumber) {
        data.mobileNumber = undefined;
        mobileNumber = undefined;
      }

      const parsedData = await updateUserSchema.safeParseAsync(data);
      if (!parsedData.success) {
        await transaction.rollback();
        return next(parsedData.error);
      }

      if (mobileNumber) normalUser.mobileNumber = mobileNumber;
      if (gender) normalUser.gender = gender;
      if (birthDate) normalUser.birthDate = birthDate;
      if (profilePicture) normalUser.profilePicture = profilePicture;

      if (firstName) normalUser.user.firstName = firstName;
      if (lastName) normalUser.user.lastName = lastName;

      await normalUser.save({ transaction });
      await normalUser.user.save({ transaction });

      if (eventTypeIds) eventTypeIds = Array.from(eventTypeIds);

      if (Object.keys(data).includes('eventTypeIds') && Array.isArray(eventTypeIds)) {
        if (Array.from(eventTypeIds!).length === 0) {
          await normalUser.setEventTypes([], { transaction });
        } else {
          const eventTypes = await EventType.findAll({ where: { id: eventTypeIds }, transaction });
          if (eventTypes.length !== eventTypeIds.length) {
            throw new Error('One or more event types are invalid');
          }
          await normalUser.setEventTypes(eventTypes, { transaction });
        }
      }
      if (provinceIds && provinceIds.length > 0) {
        const provinces = await Province.findAll({
          where: { id: provinceIds },
          transaction,
        });

        await normalUser.setProvinces(provinces, { transaction });
      }
      await transaction.commit();

      await normalUser.reload({
        include: [
          { model: User, as: 'user' },
          { model: EventType, through: { attributes: [] }, as: 'eventTypes' },
          { model: Province, as: 'provinces', through: { attributes: [] } },
        ],
      });

      const returnedNormalUser = {
        mobileNumber: normalUser.mobileNumber,
        firstName: normalUser.user?.firstName,
        lastName: normalUser.user?.lastName,
        gender: normalUser.gender,
        birthDate: normalUser.birthDate,
        interests: normalUser.eventTypes,
        provinces: normalUser.provinces,
        profilePicture: normalUser.profilePicture,
      };

      return returnedNormalUser;
    },
  );

  public getAllUsers = catchAsyncReqNext(async (req: Request, next: NextFunction) => {
    const includeOptions = [
      { model: User.scope('withAll'), as: 'user', required: false },
      { model: EventType, through: { attributes: [] }, as: 'eventTypes', required: false, seperate: true },
      { model: Province, as: 'provinces', through: { attributes: [] }, required: false, seperate: true },
    ];
    // const transaction = await this.sequelize.transaction();
    const features = new APIFeatures(NormalUser, req.query as unknown as Record<string, string>, {
      include: includeOptions,
      // subQuery: false,
      distinct: true,
      // logging: console.log,
      attributes: {
        include: [[this.sequelize.literal(`EXTRACT(YEAR FROM AGE("birthDate"))`), 'age']],

        // transaction,
      },
    })
      .filter()
      .sort()
      .limitFields()
      .paginate()
      .search();

    const totalCount = await NormalUser.count({
      where: { ...features.query.where },
      distinct: true,
      include: includeOptions,
      col: 'id',
    });
    // const finalQuery = { ...req.query, ...includeOptions };

    const users = await features.execute();

    if (!users) {
      // await transaction.rollback();
      return next(new AppError(errorMessage('error.usersNotFound'), 400));
    }

    const totalPages = Math.ceil(totalCount / features.limit);
    const totalItemsInPage = users.length;
    const hasPreviousPage = features.page > 1;
    const hasNextPage = features.page < totalPages;
    // await transaction.commit();

    return {
      page: features.page,
      totalPages,
      totalItemsInPage,
      limit: features.limit,
      totalCount,
      data: users,
      hasPreviousPage,
      hasNextPage,
    };
  });

  public findOneUser = catchAsyncService(async (mobileNumber: string, next: NextFunction) => {
    // const transaction = await this.sequelize.transaction();
    const user = await NormalUser.findOne({
      where: { mobileNumber },
      include: [
        { model: User, as: 'user' },
        { model: EventType, through: { attributes: [] }, as: 'eventTypes' },
        { model: Province, as: 'provinces', through: { attributes: [] } },
      ],
      // transaction,
    });
    if (!user) {
      // await transaction.rollback();
      return next(new AppError(errorMessage('error.userNotFound'), 404));
    }
    if (user.blocked) {
      // await transaction.rollback();
      return next(new AppError(errorMessage('error.blockedAccount'), 404));
    }

    // await transaction.commit();
    return user;
  });

  public getAllEventForUser = catchAsyncReqNext(async (req: CustomRequest, next: NextFunction, userId: number) => {
    const events = await bookTicketService.getAllEventBookedForUser(req, next, userId);
    if (!events) return next(new AppError(errorMessage('error.eventsNotFound'), 404));
    return events;
  });

  public acceptRateAppNotification = catchAsyncService(async (userId: number, next: NextFunction) => {
    const transaction = await this.sequelize.transaction();
    const userAccept = await NormalUser.findByPk(userId, { transaction });
    if (!userAccept) {
      await transaction.rollback();
      return next(new AppError('user not found', 404));
    }
    userAccept.acceptRateAppNotification = true;
    await userAccept.save({ transaction });
    await transaction.commit();

    return userAccept;
  });

  public blockAndUnblockNormalUserAccount = catchAsyncService(async (normalUserId: number, next: NextFunction) => {
    const transaction = await this.sequelize.transaction();
    // const supervisor = await NormalUser.scope('withDeactivated').findByPk(supervisorId, { transaction });
    const normalUser = await NormalUser.findByPk(normalUserId, { transaction });
    if (!normalUser) {
      await transaction.rollback();
      return next(new AppError('cannot found user account to deactivate him', 404));
    }
    normalUser.blocked = !normalUser.blocked;
    await normalUser.save({ transaction });
    await transaction.commit();
    return true;
  });

  public uploadSingleImageForProfileService = upload.single('profilePicture');

  public saveUserImageOnUpdate = catchAsyncReqNext(async (req: CustomRequest, next: NextFunction) => {
    const id = req.normalUserFromReq?.id;

    if (!id) return next(new AppError('user not found in the context', 401));

    const fileName = new URL(path.join('profile_pics', req.body.profilePicture), pathName).href;

    req.body.profilePicture = fileName;
  });

  public getOneNormalUserByMobileNumber = async (mobileNumber: string) => {
    const normalUser = await NormalUser.findOne({ where: { mobileNumber } });
    return normalUser;
  };

  public getAllNormalUserForAdminReport = async (startDate?: Date, endDate?: Date) => {
    const where: WhereOptions = {};

    if (startDate && endDate) {
      where.createdAt = { [Op.between]: [startDate, endDate] };
    }

    const users = await NormalUser.findAll({
      attributes: {
        include: [[literal(`DATE_PART('year', AGE("NormalUser"."birthDate"))`), 'age']],
        exclude: [
          'updatedAt',
          'createdAt',
          'userId',
          // 'mobileNumber',
          'profilePicture',
          'birthDate',
          'acceptRateAppNotification',
        ],
      },
      where: where,
      include: [
        { model: EventType, through: { attributes: [] }, as: 'eventTypes', attributes: ['typeName'] },
        { model: Province, as: 'provinces', through: { attributes: [] }, attributes: ['provinceName'] },
      ],
      order: [['createdAt', 'ASC']],
    });

    return users;
  };

  public getAllUsersActiveForAdminReport = async () => {
    const now = new Date();

    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    const endOfYesterday = new Date(startOfToday);
    endOfYesterday.setMilliseconds(-1);

    const startOfLastWeek = new Date(startOfToday);
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

    const startOfLastMonth = new Date(startOfToday);
    startOfLastMonth.setDate(startOfLastMonth.getDate() - 30);

    const [yesterdayActive, lastWeekActive, lastMonthActive] = await Promise.all([
      User.count({
        where: {
          lastLogin: { [Op.between]: [startOfYesterday, endOfYesterday] },
        },
      }),

      User.count({
        where: {
          lastLogin: { [Op.between]: [startOfLastWeek, endOfYesterday] },
        },
      }),

      User.count({
        where: {
          lastLogin: { [Op.between]: [startOfLastMonth, endOfYesterday] },
        },
      }),
    ]);

    return [
      {
        period: 'Yesterday',
        startDate: startOfYesterday,
        endDate: endOfYesterday,
        activeUsers: yesterdayActive,
      },
      {
        period: 'Last Week (excluding today)',
        startDate: startOfLastWeek,
        endDate: endOfYesterday,
        activeUsers: lastWeekActive,
      },
      {
        period: 'Last Month (excluding today)',
        startDate: startOfLastMonth,
        endDate: endOfYesterday,
        activeUsers: lastMonthActive,
      },
    ];
  };

  public getNewUsersDataForDashboardMainPage = async () => {
    const now = new Date();

    // Calculate reference dates
    const lastDay = new Date(now);
    lastDay.setDate(now.getDate() - 1);

    const lastWeek = new Date(now);
    lastWeek.setDate(now.getDate() - 7);

    const lastMonth = new Date(now);
    lastMonth.setMonth(now.getMonth() - 1);

    // Use a single query with COUNT and conditions
    const totalUsers = await User.count();

    const newUsersLastDay = await User.count({
      where: {
        createdAt: { [Op.gte]: lastDay },
      },
    });

    const newUsersLastWeek = await User.count({
      where: {
        createdAt: { [Op.gte]: lastWeek },
      },
    });

    const newUsersLastMonth = await User.count({
      where: {
        createdAt: { [Op.gte]: lastMonth },
      },
    });

    return {
      totalUsers,
      newUsers: {
        lastDay: newUsersLastDay,
        lastWeek: newUsersLastWeek,
        lastMonth: newUsersLastMonth,
      },
    };
  };
}
export default new NormalUserService(sequelize);
