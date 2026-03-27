import { NextFunction, Request } from 'express';
import path from 'path';
import { Op, Sequelize, Transaction } from 'sequelize';
import User from '../models/user.model';
import EventType from '../models/eventType.model.js';
import Event from '../models/event.model.js';
import { Supervisor, PendingSupervisorChanges } from '../models/supervisor.model';
import Province from '../models/provinces.model';
import scannerUserService from './scannerUser.service';
import SupervisorRequest from '../models/supervisorRequest.model.js';
import catchAsyncService from '../utils/catchAsyncService.js';
import catchAsyncReqNext from '../utils/catchAsyncReqNext.js';
import validateFieldsNames from '../utils/validateFields.js';
import APIFeatures from '../utils/apiFeatures.js';
import AppError from '../utils/AppError.js';
import { errorMessage } from '../modules/i18next.config';
import { RegisterSupervisorDto } from '../interfaces/supervisor/registerSupervisor.dto';
import { LoginSupervisorDto } from '../interfaces/supervisor/loginSupervisor.dto';
import { UpdateSupervisorDto } from '../interfaces/supervisor/updateSupervisor.dto';
import { ChangeSupervisorPassword } from '../interfaces/supervisor/changePassword.dto.js';
import upload from '../modules/multer.config';
import { registerSupervisorSchema } from '../modules/zodValidation/supervisor/registerSupervisor.config';
import { updateSupervisorSchema } from '../modules/zodValidation/supervisor/updateSupervisor.config';
import { updatePassword } from '../modules/zodValidation/supervisor/updateSupervisorPassword.config';
import { sequelize } from '../DB/sequelize.js';
import OTPService from './OTP.service';
import { ForgetSupervisorPassword } from '../interfaces/supervisor/resetPassword.dto';
import { forgetPassword } from '../modules/zodValidation/supervisor/forgetSupervisorPassword.config';
import UserTypes from '../common/enums/userTypes.enum';
import ScannerUser from '../models/scannerUser.model';
import pathName from '../utils/serverAndPort.js';

export class SupervisorService {
  private sequelize: Sequelize;

  constructor(sequelize: Sequelize) {
    this.sequelize = sequelize;
  }

  public register = catchAsyncService(async (data: RegisterSupervisorDto, next: NextFunction) => {
    const parsedData = await registerSupervisorSchema.safeParseAsync(data);
    if (!parsedData.success) {
      return next(parsedData.error);
    }
    const transaction = await this.sequelize.transaction();
    let user: User | null = null;
    user = User.build({
      firstName: data.firstName,
      lastName: data.lastName,
    });
    await user.save({ transaction });

    const username = await this.generateUserName(user.firstName, user.lastName);

    const supervisor = Supervisor.build({
      username,
      mobileNumber: data.mobileNumber,
      birthDate: data.birthDate,
      gender: data.gender,
      password: data.password,
      userId: user.id,
      province: data.province,
      location: data.location,
      workInfo: data.workInfo,
      workDocument: data.workDocument,
      acceptRateAppNotification: false,
    });
    await supervisor.save({ transaction });
    if (data.workType && data.workType.length > 0) await supervisor.setEventTypes(data.workType, { transaction });

    const returnedSupervisor = await Supervisor.findByPk(supervisor.id, {
      include: [
        {
          model: User,
          as: 'user',
        },
        { model: EventType, through: { attributes: [] }, as: 'eventTypes' },
        { model: Province, as: 'provinceRelation' },
      ],
      transaction,
    });
    await transaction.commit();

    const scannerUserData = { supervisorId: supervisor.id };
    const scannerUser = await scannerUserService.createScannerUser(scannerUserData, next);

    const messageData = {
      mobileNumber: data.mobileNumber,
      supervisor: returnedSupervisor?.username,
      supervisorPassword: data.password,
      scannerUser: scannerUser.name,
      scannerUserPassword: scannerUser.plainPassword,
    };

    OTPService.sendSupervisorSignUpMessage(messageData, next);

    return { ...returnedSupervisor?.toJSON(), age: returnedSupervisor?.age, scannerUser: scannerUser };
  });

  public login = catchAsyncService(async (data: LoginSupervisorDto, next: NextFunction) => {
    if (!data.userName) return next(new AppError(errorMessage('error.usernameEmpty'), 400));
    if (!data.password) return next(new AppError(errorMessage('error.passwordFieldEmpty'), 400));

    const isValidUsername = await this.verifyUserName(data.userName);
    if (!isValidUsername) return next(new AppError(errorMessage('error.notValidUserName'), 400));

    const isAllowed = validateFieldsNames(['userName', 'password'], Object.keys(data));
    if (isAllowed !== true) {
      return next(
        new AppError(
          `${isAllowed.length === 1 ? 'this field is' : 'these fields are'} not allowed:
          ${isAllowed.join(', ')}`,
          400,
        ),
      );
    }

    const transaction = await this.sequelize.transaction();

    const supervisor = await Supervisor.findOne({
      include: [
        {
          model: User,
          as: 'user',
        },
        { model: EventType, through: { attributes: [] }, as: 'eventTypes' },
        { model: Province, as: 'provinceRelation' },
      ],
      where: { username: data.userName },
      // attributes: ['province', 'username', 'location', 'workInfo', 'id', 'password', 'workDocument'],
      transaction,
    });

    if (!supervisor) {
      await transaction.rollback();
      return next(new AppError(errorMessage('error.getSupervisor'), 400));
    }

    if (!supervisor?.user) {
      await transaction.rollback();
      return next(new AppError(errorMessage('error.getSupervisor'), 400));
    }

    if (supervisor.blocked) {
      await transaction.rollback();
      return next(new AppError(errorMessage('error.blockedAccount'), 403));
    }

    if (supervisor.deactivated) {
      supervisor.deactivated = false;
      supervisor.save({ transaction });
      // await transaction.rollback();
      // return next(new AppError(errorMessage('error.deactivatedAccount'), 403));
    }

    if (!(await supervisor.correctPassword(data.password))) {
      await transaction.rollback();
      return next(new AppError(errorMessage('error.IncorrectSupervisorPassword'), 400));
    }

    const sendData = { mobileNumber: supervisor.mobileNumber };

    await OTPService.sendOTP(sendData, next, 'supervisor_login', transaction, UserTypes.Supervisor);

    const otpStatusData = { mobileNumber: supervisor.mobileNumber, purpose: 'supervisor_login' };
    const otpStatus = await OTPService.getOTPStatusService(otpStatusData, next, transaction);

    await transaction.commit();
    return { ...supervisor.toJSON(), age: supervisor.age, otpStatus };
  });

  public confirmLogin = async (data: { mobileNumber: string }, next: NextFunction, transaction: Transaction) => {
    if (!data.mobileNumber) return next(new AppError(errorMessage('error.mobileNumberEmpty'), 400));

    const isAllowed = validateFieldsNames(['mobileNumber'], Object.keys(data));
    if (isAllowed !== true) {
      return next(
        new AppError(
          `${isAllowed.length === 1 ? 'this field is' : 'these fields are'} not allowed:
          ${isAllowed.join(', ')}`,
          400,
        ),
      );
    }

    const supervisor = await Supervisor.findOne({
      include: [
        {
          model: User,
          as: 'user',
        },
        { model: EventType, through: { attributes: [] }, as: 'eventTypes' },
        { model: Province, as: 'provinceRelation' },
      ],
      where: { mobileNumber: data.mobileNumber },
      // attributes: ['province', 'username', 'location', 'workInfo', 'id', 'password', 'workDocument'],
      transaction,
    });
    if (!supervisor) {
      await transaction.rollback();
      return next(new AppError(errorMessage('error.getSupervisor'), 400));
    }

    if (!supervisor?.user) {
      await transaction.rollback();
      return next(new AppError(errorMessage('error.getSupervisor'), 400));
    }

    (supervisor?.user as User).lastLogin = new Date();
    await (supervisor?.user as User).save({
      fields: ['lastLogin'],
      silent: true,
      transaction,
    });
    // await transaction.commit();
    return { ...supervisor.toJSON(), age: supervisor.age };
  };

  public getOneSupervisorById = catchAsyncService(async (supervisorId: number, next: NextFunction) => {
    // const transaction = await this.sequelize.transaction();
    const supervisor = await Supervisor.findOne({
      where: { id: supervisorId },
      include: [
        { model: EventType, through: { attributes: [] }, as: 'eventTypes' },
        { model: User, as: 'user' },
        { model: Province, as: 'provinceRelation' },
      ],
      // transaction,
    });
    if (!supervisor) {
      // await transaction.rollback();
      return next(new AppError(errorMessage('error.getSupervisor'), 404));
    }
    // await transaction.commit();
    return supervisor;
  });

  public getOneSupervisor = catchAsyncService(async (username: string, next: NextFunction) => {
    // const transaction = await this.sequelize.transaction();
    const supervisor = await Supervisor.scope('withDeactivated').findOne({
      where: { username },
      include: [
        { model: EventType, through: { attributes: [] }, as: 'eventTypes' },
        { model: User, as: 'user' },
        { model: Province, as: 'provinceRelation' },
      ],
      // transaction,
    });
    if (!supervisor) {
      // await transaction.rollback();
      return next(new AppError(errorMessage('error.getSupervisor'), 404));
    }

    if (supervisor.blocked) {
      return next(new AppError(errorMessage('error.blockedAccount'), 403));
    }

    if (supervisor.deactivated) {
      return next(new AppError(errorMessage('error.deactivatedAccount'), 403));
    }
    // await transaction.commit();
    return supervisor;
  });

  public getOneSupervisorService = async (username: string, next: NextFunction) => {
    // const transaction = await this.sequelize.transaction();
    const supervisor = await Supervisor.findOne({
      where: { username },
      // include: [
      //   { model: EventType, through: { attributes: [] }, as: 'eventTypes' },
      //   { model: User, as: 'user' },
      //   { model: Province, as: 'provinceRelation' },
      // ],
    });
    if (!supervisor) {
      // await transaction.rollback();
      throw next(new AppError(errorMessage('error.getSupervisor'), 404));
    }
    // await transaction.commit();
    return supervisor;
  };

  public getOneSupervisorByMobileNumber = catchAsyncService(async (mobileNumber: string, next: NextFunction) => {
    // const transaction = await this.sequelize.transaction();
    const supervisor = await Supervisor.findOne({
      where: { mobileNumber },
      include: [
        { model: EventType, through: { attributes: [] }, as: 'eventTypes' },
        { model: User, as: 'user' },
        { model: Province, as: 'provinceRelation' },
        { model: ScannerUser, as: 'scannerUser' },
      ],
      // transaction,
    });
    if (!supervisor) {
      // await transaction.rollback();
      return next(new AppError(errorMessage('error.getSupervisor'), 404));
    }
    // await transaction.commit();
    return supervisor;
  });

  public getAllSupervisor = catchAsyncReqNext(async (req: Request, next: NextFunction) => {
    const includeOptions = [
      { model: User.scope('withAll'), as: 'user' },
      { model: Province, as: 'provinceRelation' },
      { model: EventType, through: { attributes: [] }, as: 'eventTypes' },
    ];
    // const transaction = await this.sequelize.transaction();
    const features = new APIFeatures(
      Supervisor.scope('withDeactivated'),
      req.query as unknown as Record<string, string>,
      {
        include: includeOptions,
        paranoid: false,
        // transaction,
      },
    )
      .filter()
      .search()
      .sort()
      .limitFields()
      .paginate();

    const totalCount = await Supervisor.scope('withDeactivated').count({
      where: features.query.where,
      include: includeOptions,
      distinct: true,
      // transaction,
    });
    // const supervisors = await features.execute(transaction);
    const supervisors = await features.execute();

    if (!supervisors) {
      // await transaction.rollback();
      return next(new AppError(errorMessage('error.getAllSupervisors'), 400));
    }

    const totalPages = Math.ceil(totalCount / features.limit);
    const totalItemsInPage = supervisors.length;
    const hasPreviousPage = features.page > 1;
    const hasNextPage = features.page < totalPages;
    // await transaction.commit();

    return {
      page: features.page,
      totalPages,
      totalItemsInPage,
      limit: features.limit,
      totalCount,
      data: supervisors,
      hasPreviousPage,
      hasNextPage,
    };
  });

  public getSupervisorProfileInfo = catchAsyncService(async (id: number, next: NextFunction) => {
    // const transaction = await this.sequelize.transaction();
    const supervisor = await Supervisor.findByPk(id, {
      include: [
        { model: User.scope('withAll'), as: 'user' },
        { model: Province, as: 'provinceRelation' },
        { model: EventType, through: { attributes: [] }, as: 'eventTypes' },
      ],
      // transaction,
    });
    if (!supervisor) {
      // await transaction.rollback();
      return next(new AppError('error.getSupervisor', 404));
    }
    // await transaction.commit();

    return { ...supervisor.toJSON(), age: supervisor.age };
  });

  public updateSupervisorInfoFromAdmin = catchAsyncService(async (data: UpdateSupervisorDto, next: NextFunction) => {
    const transaction = await this.sequelize.transaction();

    const supervisor = await Supervisor.findByPk(data.supervisorId, {
      transaction,
      include: { model: User, as: 'user' },
    });
    if (!supervisor) {
      await transaction.rollback();
      throw new AppError('Supervisor not found', 404);
    }

    const { supervisorId, userId, ...restData } = data;
    if (supervisor && supervisor.mobileNumber && supervisor.mobileNumber === data.mobileNumber)
      restData.mobileNumber = undefined;

    const parsedData = await updateSupervisorSchema.safeParseAsync(restData);
    if (!parsedData.success) {
      await transaction.rollback();
      return next(parsedData.error);
    }

    const { firstName, lastName, ...supervisorData } = restData;
    await supervisor.update(supervisorData, { transaction, validate: true });
    if (data.workType && data.workType.length > 0) await supervisor.setEventTypes(data.workType, { transaction });

    if (supervisor.user) await supervisor.user.update({ firstName, lastName }, { transaction, validate: true });

    const updatedSupervisor = await Supervisor.findByPk(data.supervisorId, {
      include: [
        { model: User, as: 'user' },
        { model: Province, as: 'provinceRelation' },
        { model: EventType, as: 'eventTypes' },
      ],
      transaction,
    });

    await transaction.commit();

    return updatedSupervisor ? updatedSupervisor.toJSON() : null;
  });

  public updateMe = catchAsyncService(async (data: UpdateSupervisorDto, next: NextFunction) => {
    const transaction = await this.sequelize.transaction();
    const updateRequest = await PendingSupervisorChanges.findOne({
      where: { supervisorId: data.supervisorId, isApproved: false, isRejected: false },
      transaction,
    });
    if (updateRequest) {
      await transaction.rollback();
      return next(new AppError(errorMessage('error.PreviousUpdateRequest'), 400));
    }

    const { supervisorId, userId, ...restData } = data;

    const supervisor = await Supervisor.findByPk(data.supervisorId, { transaction });
    if (supervisor && supervisor.mobileNumber && supervisor.mobileNumber === data.mobileNumber)
      restData.mobileNumber = undefined;

    const parsedData = await updateSupervisorSchema.safeParseAsync(restData);
    if (!parsedData.success) {
      await transaction.rollback();
      return next(parsedData.error);
    }

    let updateObject = {
      isApproved: false,
      supervisorId: data.supervisorId,
      userId: data.userId,
      mobileNumber: data.mobileNumber,
      birthDate: data.birthDate!,
      gender: data.gender!,
      location: data.location!,
      workInfo: data.workInfo!,
      firstName: data.firstName!,
      lastName: data.lastName!,
      workDocument: String(data.workDocument!),
      workType: data.workType!,
    };

    const supervisorupdate = await PendingSupervisorChanges.create(updateObject, { transaction });
    if (!supervisorupdate) {
      await transaction.rollback();
      return next(new AppError(errorMessage('error.supervisorNotFound'), 400));
    }
    const supervisorRequest = await SupervisorRequest.create(
      {
        requestTargetId: supervisorupdate.supervisorId,
        requestType: 'profileUpdate',
        supervisorId: data.supervisorId,
      },
      { transaction, validate: true },
    );
    if (!supervisorRequest) {
      await transaction.rollback();
      return next(new AppError('Cannot create request for this event', 400));
    }
    await transaction.commit();
    const supervisorData = { ...supervisor?.get({ plain: true }), ...data, supervisor };

    return { ...supervisorData, supervisorRequest: supervisorRequest.dataValues.id };
  });

  public updateSupervisorPassword = catchAsyncService(async (data: ChangeSupervisorPassword, next: NextFunction) => {
    const transaction = await this.sequelize.transaction();
    const supervisor = await Supervisor.findByPk(data.supervisorId, { transaction });
    if (!supervisor) return next(new AppError('supervisor not found', 400));

    const { supervisorId, ...restData } = data;
    const parsedData = await updatePassword(supervisor).safeParseAsync(restData);
    if (!parsedData.success) {
      await transaction.rollback();
      return next(parsedData.error);
    }

    if (!(await supervisor.correctPassword(parsedData.data.oldPassword))) {
      await transaction.rollback();
      return next(new AppError(errorMessage('error.incorrectPassword'), 400));
    }

    const sendData = { mobileNumber: supervisor.mobileNumber, password: data.password, supervisorId };

    console.log(supervisor.PasswordChangeDate);

    if (!supervisor.PasswordChangeDate) {
      supervisor.password = data.password;
      await supervisor.save({ transaction });

      transaction.commit();
      return { ...supervisor.toJSON(), otpStatus: null };
    }
    await OTPService.sendOTP(sendData, next, 'spervisor_password_reset', transaction, UserTypes.Supervisor);

    const otpStatusData = { mobileNumber: supervisor.mobileNumber, purpose: 'spervisor_password_reset' };
    const otpStatus = await OTPService.getOTPStatusService(otpStatusData, next, transaction);

    transaction.commit();
    return { ...supervisor.toJSON(), otpStatus };
  });

  public confirmUpdateSupervisorPassword = async (
    data: ChangeSupervisorPassword,
    next: NextFunction,
    transaction: Transaction,
  ) => {
    const supervisor = await Supervisor.findByPk(data.supervisorId, { transaction });
    if (!supervisor) return next(new AppError('supervisor not found', 400));

    supervisor.password = data.password;
    await supervisor.save({ transaction });
    // transaction.commit();
    return supervisor;
  };

  public forgetSupervisorPassword = catchAsyncService(async (data: ForgetSupervisorPassword, next: NextFunction) => {
    const transaction = await this.sequelize.transaction();
    const supervisor = await Supervisor.findOne({ where: { mobileNumber: data.mobileNumber }, transaction });
    if (!supervisor) return next(new AppError('supervisor not found', 400));

    const parsedData = await forgetPassword.safeParseAsync(data);
    if (!parsedData.success) {
      await transaction.rollback();
      return next(parsedData.error);
    }

    await OTPService.sendOTP(data, next, 'supervisor_forget_password', transaction, UserTypes.Supervisor);

    const otpStatusData = { mobileNumber: supervisor.mobileNumber, purpose: 'supervisor_forget_password' };
    const otpStatus = await OTPService.getOTPStatusService(otpStatusData, next, transaction);

    transaction.commit();
    return { ...supervisor.toJSON(), otpStatus };
  });

  public confirmForgetSupervisorPassword = async (
    data: ForgetSupervisorPassword,
    next: NextFunction,
    transaction: Transaction,
  ) => {
    const supervisor = await Supervisor.findOne({ where: { mobileNumber: data.mobileNumber }, transaction });
    if (!supervisor) return next(new AppError('supervisor not found', 400));

    const parsedData = await forgetPassword.safeParseAsync(data);
    if (!parsedData.success) {
      await transaction.rollback();
      return next(parsedData.error);
    }

    supervisor.password = data.password;
    await supervisor.save({ transaction });
    // transaction.commit();
    return supervisor;
  };

  public approveupdateSupervisorFromAdmin = catchAsyncService(async (supervisorId: number, next: NextFunction) => {
    const transaction = await this.sequelize.transaction();
    console.log();
    const pendingChanges = await PendingSupervisorChanges.findOne({
      where: { supervisorId, isApproved: false, isRejected: false },
      include: [{ model: Supervisor, as: 'supervisor', include: [{ model: User, as: 'user' }] }],
      transaction,
    });
    if (!pendingChanges) {
      transaction.rollback();
      return next(new AppError('cannot find any changes for this supervisor', 400));
    }

    const changes = Object.entries(pendingChanges.get()).reduce(
      (acc, [key, value]) => {
        if (value !== null && value !== undefined) {
          acc[key as keyof PendingSupervisorChanges] = value;
        }
        return acc;
      },
      {} as Record<string, PendingSupervisorChanges>,
    );
    delete changes.id;

    console.log(changes);

    await Supervisor.update({ ...changes }, { transaction, where: { id: supervisorId }, validate: true });

    const { userId, firstName, lastName } = changes as unknown as {
      userId: number;
      firstName?: string;
      lastName?: string;
    };

    if (firstName || lastName) {
      const userName: Partial<{ firstName: string; lastName: string }> = {};
      if (firstName) userName.firstName = firstName;
      if (lastName) userName.lastName = lastName;
      await User.update(userName, { transaction, where: { id: userId }, validate: true });
    }

    if (changes.workType) {
      const types = [...(changes.workType as unknown as Array<number>)];
      const supervisor = await Supervisor.findByPk(supervisorId, { transaction });
      if (!supervisor) return next(new AppError(errorMessage('error.supervisorNotFound'), 400));
      const validEventTypes = await EventType.findAll({
        where: {
          id: {
            [Op.in]: types,
          },
        },
        attributes: ['id'],
        transaction,
      });
      await supervisor.setEventTypes(validEventTypes, { transaction, where: { id: supervisorId } });
    }
    pendingChanges.isApproved = true;
    await pendingChanges.validate();
    await pendingChanges.save({ transaction });
    await transaction.commit();

    return true;
  });

  public rejectupdateSupervisorFromAdmin = catchAsyncService(async (supervisorId: number, next: NextFunction) => {
    if (!supervisorId) return next(new AppError(errorMessage('error.supervisorNotFound'), 404));
    const transaction = await this.sequelize.transaction();
    const pendingChanges = await PendingSupervisorChanges.findOne({
      where: { supervisorId, isApproved: false, isRejected: false },
      include: [{ model: Supervisor, as: 'supervisor', include: [{ model: User, as: 'user' }] }],
      transaction,
    });
    if (!pendingChanges) {
      transaction.rollback();
      return next(new AppError('cannot find any changes for this supervisor', 400));
    }
    pendingChanges.isRejected = true;
    await pendingChanges.validate();
    await pendingChanges.save({ transaction });

    await transaction.commit();
    return true;
  });

  public getAllUpdateSupervisorsRequestsService = catchAsyncReqNext(async (req: Request, next: NextFunction) => {
    const transaction = await this.sequelize.transaction();
    const pendingChanges = await PendingSupervisorChanges.findAll({
      where: { isApproved: false },
      include: [
        { model: Supervisor, as: 'supervisor' },
        { model: User, as: 'user' },
      ],
      transaction,
    });
    if (!pendingChanges) {
      await transaction.rollback();
      return next(new AppError('canoot return all pending changes requests', 400));
    }
    await transaction.commit();
    return pendingChanges;
  });

  public deactivateSupervisorAccount = catchAsyncService(async (supervisorId: number, next: NextFunction) => {
    const transaction = await this.sequelize.transaction();
    const supervisor = await Supervisor.findByPk(supervisorId, { transaction });
    if (!supervisor) {
      await transaction.rollback();
      return next(new AppError('cannot found supervisor to deactivate him', 404));
    }
    supervisor.deactivated = true;
    await supervisor.save({ transaction });
    await transaction.commit();
    return true;
  });

  public activateSupervisorAccount = catchAsyncService(async (supervisorId: number, next: NextFunction) => {
    const transaction = await this.sequelize.transaction();
    const supervisor = await Supervisor.scope('withDeactivated').findByPk(supervisorId, { transaction });
    if (!supervisor) {
      await transaction.rollback();
      return next(new AppError('cannot found supervisor to deactivate him', 404));
    }
    supervisor.deactivated = false;
    await supervisor.save({ transaction });
    await transaction.commit();
    return true;
  });

  public deleteSupervisorAccountFromAdmin = catchAsyncService(async (supervisorId: number, next: NextFunction) => {
    const transaction = await this.sequelize.transaction();
    const supervisor = await Supervisor.scope('withDeactivated').findByPk(supervisorId, {
      include: [
        {
          model: Event.scope('withHiddenAndAccepted'),
          as: 'events',
          where: {
            startApplyDate: { [Op.lte]: new Date() },
            endEventDate: { [Op.gte]: new Date() },
          },
          required: false,
        },
        { model: User, as: 'user' },
      ],
      transaction,
    });
    if (!supervisor) {
      await transaction.rollback();
      return next(new AppError('cannot found supervisor to deactivate him', 404));
    }
    if (supervisor.events!.length > 0) {
      await transaction.rollback();
      return next(new AppError(errorMessage('error.deleteSupervisorHaveEvents'), 400));
    }
    await supervisor.destroy({ transaction });
    await transaction.commit();
    return true;
  });

  public deleteSupervisorAccountRequest = catchAsyncService(async (supervisorId: number, next: NextFunction) => {
    const transaction = await this.sequelize.transaction();
    const supervisor = await Supervisor.scope('withDeactivated').findByPk(supervisorId, { transaction });
    if (!supervisor) {
      await transaction.rollback();
      return next(new AppError('cannot found supervisor to deactivate him', 404));
    }
    supervisor.deletePending = true;
    await supervisor.save({ transaction });
    const supervisorRequest = await SupervisorRequest.create(
      {
        requestTargetId: supervisor.id,
        requestType: 'profileDelete',
        supervisorId: supervisor.id,
      },
      { transaction, validate: true },
    );

    if (!supervisorRequest) {
      await transaction.rollback();
      return next(new AppError('Cannot create request for this event', 400));
    }
    await transaction.commit();
    const supervisorData = supervisor.toJSON();
    return { requestStatus: true, ...supervisorData, supervisorRequest: supervisorRequest.id };
  });

  public AcceptDeleteSupervisorAccount = catchAsyncService(async (supervisorId: number, next: NextFunction) => {
    const transaction = await this.sequelize.transaction();
    const supervisor = await Supervisor.scope('withDeactivated').findByPk(supervisorId, { transaction });
    if (!supervisor) {
      await transaction.rollback();
      return next(new AppError('cannot found supervisor to deactivate him', 404));
    }
    if (supervisor.deletePending !== true) {
      await transaction.rollback();
      return next(new AppError('this supervisor not request to delete his account', 400));
    }
    await supervisor.destroy({ transaction });
    await transaction.commit();
    return true;
  });

  public blockAndUnblockSupervisorAccount = catchAsyncService(async (supervisorId: number, next: NextFunction) => {
    const transaction = await this.sequelize.transaction();
    const supervisor = await Supervisor.scope('withDeactivated').findByPk(supervisorId, { transaction });
    if (!supervisor) {
      await transaction.rollback();
      return next(new AppError('cannot found supervisor to deactivate him', 404));
    }
    supervisor.blocked = !supervisor.blocked;
    await supervisor.save({ transaction });
    await transaction.commit();
    return true;
  });

  public acceptRateAppNotification = catchAsyncService(async (supervisorId: number, next: NextFunction) => {
    const transaction = await this.sequelize.transaction();
    const supervisorAccept = await Supervisor.findByPk(supervisorId, { transaction });
    if (!supervisorAccept) {
      await transaction.rollback();
      return next(new AppError('supervisor not found', 404));
    }
    supervisorAccept.acceptRateAppNotification = true;
    await supervisorAccept.save({ transaction });
    await transaction.commit();

    return supervisorAccept;
  });

  public uploadWorkDocumentService = upload.single('workDocument');

  public saveSupervisorWorkDocumentService = catchAsyncReqNext(async (req: Request, next: NextFunction) => {
    const fileName = new URL(path.join('workDocument', req.body.workDocument), pathName).href;

    req.body.workDocument = fileName;
  });

  private async verifyUserName(username: string): Promise<boolean> {
    const regex = /^[\u0600-\u06FFa-zA-Z]{2,}-[\u0600-\u06FFa-zA-Z]{2,}-\d{5}$/;
    return regex.test(username);
  }

  private async generateUserName(fName: string, lName: string) {
    let uniqueUsernameFound = false;
    let username = '';

    while (!uniqueUsernameFound) {
      const randomNumber = Math.floor(10000 + Math.random() * 90000);
      const generatedUsername = `${fName}-${lName}-${randomNumber}`;
      const existingSupervisor = await Supervisor.findOne({
        where: { username: generatedUsername },
      });

      if (!existingSupervisor) {
        username = generatedUsername;
        uniqueUsernameFound = true;
      }
    }
    return username;
  }
}
export default new SupervisorService(sequelize);
