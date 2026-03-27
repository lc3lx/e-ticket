import { NextFunction, Request } from 'express';
import { Sequelize, Transaction } from 'sequelize';
import { UpdateAdminDto } from '../interfaces/dashboard/updateAdmin.dto.js';
import { UpdateAdminInfoDto } from '../interfaces/dashboard/updateAdminInfo.dto.js';
import catchAsyncService from '../utils/catchAsyncService.js';
import catchAsyncCred from '../utils/catchAsyncWithCred.js';
import User from '../models/user.model';
import DashboardAdmin from '../models/dashboardAdmin.model.js';
import AppError from '../utils/AppError.js';
import { RegisterAdminDto } from '../interfaces/dashboard/registerAdmin.dto.js';
import { LoginAdminDto } from '../interfaces/dashboard/loginAdmin.dto.js';
import APIFeatures from '../utils/apiFeatures.js';
import catchAsyncReqNext from '../utils/catchAsyncReqNext.js';
import { errorMessage } from '../modules/i18next.config';
import { registerAdminSchema } from '../modules/zodValidation/admin/registerAdmin.config.js';
import { updateAdminSchema } from '../modules/zodValidation/admin/updateAdminProfile.config.js';
import { updateAdminInfo } from '../modules/zodValidation/admin/updateAdmin.config.js';
import { emailRegex } from '../modules/zodValidation/admin/admin.schema.js';
import DashboardLog from '../models/dashboardLogs.model.js';
import eventService from './event.service.js';

// global update admin, delete (not delete me), check password confirm on update, disable account
export class DashboardService {
  private sequelize: Sequelize;

  constructor(sequelize: Sequelize) {
    this.sequelize = sequelize;
  }

  public register = catchAsyncService(async (data: RegisterAdminDto, next: NextFunction) => {
    const parsedData = await registerAdminSchema.safeParseAsync(data);
    if (!parsedData.success) {
      return next(parsedData.error);
    }

    const transaction = await this.sequelize.transaction();
    const emailExist = await DashboardAdmin.findOne({
      where: { email: data.email },
      transaction,
    });
    if (emailExist) {
      transaction.rollback();
      return next(new AppError(errorMessage('error.emailExist'), 400));
    }

    let user: User | null = null;
    user = User.build({
      firstName: data.firstName,
      lastName: data.lastName,
      lastLogin: new Date(Date.now()),
    });
    await user.validate();
    await user.save({ transaction });

    const dashboardAdmin = DashboardAdmin.build({
      email: data.email,
      role: data.role,
      password: data.password,
      userId: user.id,
    });
    await dashboardAdmin.validate();
    await dashboardAdmin.save({ transaction });
    await transaction.commit();
    const returnedAdmin = {
      id: dashboardAdmin.id,
      email: dashboardAdmin.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: dashboardAdmin.role,
      userId: dashboardAdmin.userId,
    };
    return returnedAdmin;
  });

  public login = catchAsyncService(async (data: LoginAdminDto, next: NextFunction) => {
    if (!data.email) return next(new AppError(errorMessage('error.emailFieldEmpty'), 400));
    if (!data.password) return next(new AppError(errorMessage('error.passwordFieldEmpty'), 400));
    const isValidEmail = await this.verifyEmailAddress(data.email);
    if (!isValidEmail) return next(new AppError(errorMessage('error.NotValidEmail'), 400));

    const transaction = await this.sequelize.transaction();

    const dashboardAdmin = await DashboardAdmin.findOne({
      include: {
        model: User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'lastLogin'],
      },
      where: { email: data.email },
      attributes: ['email', 'role', 'password', 'id', 'blocked'],
      transaction,
    });
    if (!dashboardAdmin) {
      await transaction.rollback();
      return next(new AppError(errorMessage('error.adminAccountNotExist'), 400));
    }
    if (!dashboardAdmin?.user) {
      await transaction.rollback();
      return next(new AppError(errorMessage('error.adminNotFound'), 400));
    }
    if (dashboardAdmin.blocked) {
      return next(new AppError(errorMessage('error.blockedAccount'), 403));
    }

    if (!(await dashboardAdmin.correctPassword(data.password))) {
      await transaction.rollback();
      return next(new AppError(errorMessage('error.IncorrectEmailOrPassword'), 401));
    }
    (dashboardAdmin?.user as User).lastLogin = new Date();
    await (dashboardAdmin?.user as User).save({
      fields: ['lastLogin'],
      silent: true,
      transaction,
    });
    await transaction.commit();
    const dashboardAdminRes = {
      id: dashboardAdmin.id,
      email: dashboardAdmin.email,
      role: dashboardAdmin.role,
      user: {
        id: dashboardAdmin.user.id,
        firstName: dashboardAdmin.user.firstName,
        lastName: dashboardAdmin.user.lastName,
        lastLogin: dashboardAdmin.user.lastLogin,
      },
    };
    return dashboardAdminRes;
  });

  public getAdminProfile = catchAsyncService(async (email: string, next: NextFunction) => {
    const dashboardAdmin = await DashboardAdmin.findOne({
      include: { model: User, as: 'user' },
      where: { email: email },
    });
    if (!dashboardAdmin) return next(new AppError(errorMessage('error.adminNotFound'), 404));
    if (dashboardAdmin.blocked) {
      return next(new AppError(errorMessage('error.blockedAccount'), 403));
    }
    const dashboardAdminRes = {
      email: dashboardAdmin.email,
      role: dashboardAdmin.role,
      user: {
        firstName: dashboardAdmin.user.firstName,
        lastName: dashboardAdmin.user.lastName,
        lastLogin: dashboardAdmin.user.lastLogin,
      },
    };
    return dashboardAdminRes;
  });

  public updateAdminProfileInfo = catchAsyncCred(async (email: string, data: UpdateAdminDto, next: NextFunction) => {
    const transaction: Transaction = await this.sequelize.transaction();

    const admin = await DashboardAdmin.findOne({ where: { email }, include: { model: User, as: 'user' }, transaction });
    if (!admin) {
      await transaction.rollback();
      return next(new AppError(errorMessage('error.adminNotFound'), 404));
    }
    if (admin.blocked) {
      return next(new AppError(errorMessage('error.blockedAccount'), 403));
    }

    const parsedData = await updateAdminSchema.safeParseAsync(data);
    if (!parsedData.success) {
      await transaction.rollback();
      return next(parsedData.error);
    }

    const { firstName, lastName, oldPassword, password, passwordConfirm } = data;

    if (admin.user && (firstName || lastName)) {
      if (firstName) admin.user.firstName = firstName;
      if (lastName) admin.user.lastName = lastName;
      await admin.user.save({ transaction });
    }
    if (password && oldPassword) {
      if (!(await admin.correctPassword(oldPassword))) {
        await transaction.rollback();
        return next(new AppError(errorMessage('error.incorrectPassword'), 401));
      }
      admin.password = password;
      await admin.validate();
      await admin.save({ transaction });
    }

    await transaction.commit();

    const dashboardAdminRes = {
      email: admin.email,
      role: admin.role,
      user: {
        firstName: admin.user.firstName,
        lastName: admin.user.lastName,
        lastLogin: admin.user.lastLogin,
      },
    };
    return dashboardAdminRes;
  });

  public updateAdminInfo = catchAsyncCred(async (id: number, data: UpdateAdminInfoDto, next: NextFunction) => {
    const transaction: Transaction = await this.sequelize.transaction();

    const admin = await DashboardAdmin.findOne({ where: { id }, include: { model: User, as: 'user' }, transaction });
    if (!admin) {
      await transaction.rollback();
      return next(new AppError(errorMessage('error.adminNotFound'), 404));
    }

    const parsedData = await updateAdminInfo.safeParseAsync(data);
    if (!parsedData.success) {
      await transaction.rollback();
      return next(parsedData.error);
    }

    const { firstName, lastName, oldPassword, password, passwordConfirm, role } = data;

    if (admin.user && (firstName || lastName)) {
      if (firstName) admin.user.firstName = firstName;
      if (lastName) admin.user.lastName = lastName;
      await admin.user.save({ transaction });
    }
    if (password && oldPassword) {
      if (!(await admin.correctPassword(oldPassword))) {
        await transaction.rollback();
        return next(new AppError(errorMessage('error.incorrectPassword'), 401));
      }
      admin.password = password;
    }

    if (role) admin.role = role;
    await admin.validate();
    await admin.save({ transaction });

    await transaction.commit();

    const dashboardAdminRes = {
      email: admin.email,
      role: admin.role,
      user: {
        firstName: admin.user.firstName,
        lastName: admin.user.lastName,
        lastLogin: admin.user.lastLogin,
      },
    };
    return dashboardAdminRes;
  });

  public deleteAdmin = catchAsyncService(async (id: number, next: NextFunction) => {
    const transaction: Transaction = await this.sequelize.transaction();

    const admin = await DashboardAdmin.findOne({ where: { id }, include: { model: User, as: 'user' }, transaction });
    if (!admin) {
      await transaction.rollback();
      return next(new AppError(errorMessage('error.adminNotFound'), 404));
    }
    await DashboardAdmin.destroy({ where: { id }, transaction });

    await transaction.commit();
    return true;
  });

  public getOneAdmin = catchAsyncService(async (email: string, next: NextFunction) => {
    const admin = await DashboardAdmin.findOne({ where: { email }, include: { model: User, as: 'user' } });

    if (!admin) return next(new AppError(errorMessage('error.adminNotFound'), 404));
    return admin;
  });

  public getOneAdminService = async (id: number, next: NextFunction) => {
    const admin = await DashboardAdmin.findOne({ where: { id }, include: { model: User, as: 'user' } });

    if (!admin) return next(new AppError(errorMessage('error.adminNotFound'), 404));
    return admin;
  };

  public getAllAdminsAccount = catchAsyncReqNext(async (req: Request, next: NextFunction) => {
    const includeOptions = [{ model: User.scope('withAll'), as: 'user' }];
    const features = new APIFeatures(DashboardAdmin, req.query as unknown as Record<string, string>, {
      include: includeOptions,
    })
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const totalCount = await DashboardAdmin.count({
      where: features.query.where,
      include: includeOptions,
    });

    const admins = await features.execute();

    if (!admins) return next(new AppError(errorMessage('error.adminsNotFound'), 400));

    const totalPages = Math.ceil(totalCount / features.limit);
    const totalItemsInPage = admins.length;
    const hasPreviousPage = features.page > 1;
    const hasNextPage = features.page < totalPages;

    return {
      page: features.page,
      totalPages,
      totalItemsInPage,
      limit: features.limit,
      totalCount,
      data: admins,
      hasPreviousPage,
      hasNextPage,
    };
  });

  public getAllAdminLogs = catchAsyncReqNext(async (req: Request, next: NextFunction) => {
    const features = new APIFeatures(DashboardLog, req.query as unknown as Record<string, string>, {})
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const totalCount = await DashboardLog.count({
      where: features.query.where,
    });

    const logs = await features.execute();

    if (!logs) return next(new AppError(errorMessage('error.logsNotFound'), 400));

    const totalPages = Math.ceil(totalCount / features.limit);
    const totalItemsInPage = logs.length;
    const hasPreviousPage = features.page > 1;
    const hasNextPage = features.page < totalPages;

    return {
      page: features.page,
      totalPages,
      totalItemsInPage,
      limit: features.limit,
      totalCount,
      data: logs,
      hasPreviousPage,
      hasNextPage,
    };
  });

  public getMainPageData = catchAsyncReqNext(async (req: Request, next: NextFunction) => {
    const eventAggregateCount = await eventService.getEventStatusAggregationForDashboardMainPage();
    const newUsersAggregate = await normalUserService.getNewUsersDataForDashboardMainPage();
    const ticketssoldToday = await ticketService.getTicketsCountTodayForDashboardMainPage();
    const lastSentNotifications = await notificationService.getLastAdminNotificationsForMainPage();

    return { eventAggregateCount, newUsersAggregate, ticketssoldToday, lastSentNotifications };
  });

  public blockAndUnblockAdminAccount = catchAsyncService(async (adminId: number, next: NextFunction) => {
    const transaction = await this.sequelize.transaction();
    const admin = await DashboardAdmin.findByPk(adminId, { transaction });
    if (!admin) {
      await transaction.rollback();
      return next(new AppError('cannot found admin to deactivate him', 404));
    }
    admin.blocked = !admin.blocked;
    await admin.save({ transaction });
    await transaction.commit();
    return true;
  });

  private async verifyEmailAddress(email: string) {
    if (email === '') return false;
    const regex = emailRegex;
    if (!regex.test(email)) return false;
    return true;
  }
}

import { sequelize } from '../DB/sequelize.js';
import normalUserService from './normalUser.service.js';
import ticketService from './ticket.service.js';
import notificationService from './notification.service.js';
export default new DashboardService(sequelize);
