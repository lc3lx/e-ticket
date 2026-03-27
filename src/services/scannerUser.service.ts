import { NextFunction } from 'express';
import path from 'path';
import { Sequelize, Transaction } from 'sequelize';
import pathName from '../utils/serverAndPort.js';
import { CustomRequest } from '../interfaces/auth/extendRequest.dto.js';
import upload from '../modules/multer.config.js';
import ScannerUser from '../models/scannerUser.model.js';
import { Supervisor } from '../models/supervisor.model.js';
import Event from '../models/event.model.js';
import catchAsyncService from '../utils/catchAsyncService.js';
import catchAsyncReqNext from '../utils/catchAsyncReqNext.js';
import { CreateScannerUserDto } from '../interfaces/scannerUser/createScannerUser.dto.js';
import { UpdateScannerUserDto } from '../interfaces/scannerUser/updateScannerUser.dto.js';
import { ScannerUserLoginDto } from '../interfaces/scannerUser/scannerUserLogin.dto.js';
import { validateForeignKey } from '../utils/validateForeignKey.js';
import validateFieldsNames from '../utils/validateFields.js';
import AppError from '../utils/AppError.js';
import { errorMessage } from '../modules/i18next.config.js';
import { sequelize } from '../DB/sequelize.js';
import APIFeatures from '../utils/apiFeatures.js';
import { EventService } from './event.service.js';
import EventType from '../models/eventType.model.js';
import User from '../models/user.model.js';
import Province from '../models/provinces.model.js';
import { ChangeScannerPassword } from '../interfaces/scannerUser/changePassword.dto.js';
import OTPService from './OTP.service.js';
import { updatePassword } from '../modules/zodValidation/supervisor/updateSupervisorPassword.config';
import UserTypes from '../common/enums/userTypes.enum.js';

export class ScannerUserService {
  private sequelize: Sequelize;

  constructor(sequelize: Sequelize) {
    this.sequelize = sequelize;
  }

  public scannerUserLogin = catchAsyncService(async (data: ScannerUserLoginDto, next: NextFunction) => {
    const isAllowed = validateFieldsNames(['name', 'password'], Object.keys(data));
    if (isAllowed !== true) {
      return next(
        new AppError(
          `${isAllowed.length === 1 ? 'this field is' : 'these fields are'} not allowed:
          ${isAllowed.join(', ')}`,
          400,
        ),
      );
    }
    if (!data.name) return next(new AppError(errorMessage('error.scannerNameIsEmpty'), 400));
    if (!(await this.verifyscannerUserName(data.name)))
      return next(new AppError(errorMessage('error.namePattern'), 400));
    if (!data.password) return next(new AppError(errorMessage('error.passwordIsEmpty'), 400));

    // ScannerUser.cor

    const transaction = await this.sequelize.transaction();

    const scannerUser = await ScannerUser.findOne({
      where: { name: data.name },
      include: { model: Supervisor, as: 'supervisor' },
    });

    if (!scannerUser) {
      await transaction.rollback();
      return next(new AppError(errorMessage('error.scannerUserserNotRegistered'), 400));
    }
    if (scannerUser?.supervisor?.blocked) {
      await transaction.rollback();
      return next(new AppError(errorMessage('error.blockedAccount'), 400));
    }
    if (scannerUser?.supervisor?.deactivated) {
      await transaction.rollback();
      return next(new AppError(errorMessage('error.deactivatedAccount'), 400));
    }
    await transaction.commit();
    if (scannerUser.deactivated) return next(new AppError(errorMessage('error.DeactivatedScannerUser'), 400));

    if (!(await scannerUser.correctPassword(data.password))) {
      return next(new AppError(errorMessage('error.IncorrectSupervisorPassword'), 400));
    }

    const { password, ...scannerUserWithoutPassword } = scannerUser.get({ plain: true });
    return scannerUserWithoutPassword;
  });

  public getAllScannerUser = catchAsyncReqNext(async (req: CustomRequest, next: NextFunction) => {
    const queryOptions: any = {
      include: [
        {
          model: Supervisor,
          as: 'supervisor',
          include: [
            { model: EventType, as: 'eventTypes', required: false },
            { model: User, as: 'user', required: false },
            { model: Province, as: 'provinceRelation', required: false },
          ],
        },
      ],
    };

    if (req.supervisorFromReq) queryOptions.where = { supervisorId: req.supervisorFromReq.id };

    const features = new APIFeatures(ScannerUser, req.query as unknown as Record<string, string>, {
      include: queryOptions.include,
      where: { ...queryOptions.where },
    })
      .filter()
      .sort()
      .limitFields()
      .paginate()
      .search();

    const totalCount = await ScannerUser.count({
      include: queryOptions.include,
      where: features.query.where,
      distinct: true,
    });
    const scannerUser = await features.execute();

    if (!scannerUser) {
      return next(new AppError('No scannerUser found', 404));
    }

    const totalPages = Math.ceil(totalCount / features.limit);
    const totalItemsInPage = scannerUser.length;
    const hasPreviousPage = features.page > 1;
    const hasNextPage = features.page < totalPages;

    return {
      page: features.page,
      totalPages,
      totalItemsInPage,
      limit: features.limit,
      totalCount,
      data: scannerUser,
      hasPreviousPage,
      hasNextPage,
    };
  });

  public getScannerUserById = catchAsyncReqNext(async (req: CustomRequest, next: NextFunction, id: number) => {
    const queryOptions: any = {
      include: {
        model: Supervisor,
        as: 'supervisor',
        include: [
          { model: User, as: 'user' },
          { model: EventType, as: 'eventTypes' },
          { model: Province, as: 'provinceRelation' },
        ],
      },
      where: { id },
    };

    if (req.supervisorFromReq) queryOptions.where = { ...queryOptions.where, supervisorId: req.supervisorFromReq.id };

    const scannerUser = await ScannerUser.findOne(queryOptions);
    if (!scannerUser) {
      return next(new AppError(`scanner User with ID ${id} not found`, 404));
    }
    return scannerUser;
  });

  public getScannerUserByName = catchAsyncService(async (name: string, next: NextFunction) => {
    const scannerUser = await ScannerUser.findOne();
    if (!scannerUser) {
      return next(new AppError(`scanner User with name ${name} not found`, 404));
    }
    return scannerUser;
  });

  public createScannerUser = catchAsyncService(async (data: CreateScannerUserDto, next: NextFunction) => {
    const isAllowed = validateFieldsNames([...this.scannerUserFields, 'supervisorId'], Object.keys(data));
    if (isAllowed !== true) {
      return next(
        new AppError(
          `${isAllowed.length === 1 ? 'this field is' : 'these fields are'} not allowed:
            ${isAllowed.join(', ')}`,
          400,
        ),
      );
    }

    if (!(await validateForeignKey(Supervisor, data.supervisorId, 'Supervisor')))
      return next(new AppError('Invalid supervisorId', 400));

    const transaction = await this.sequelize.transaction();

    const supervisor = await Supervisor.findByPk(data.supervisorId);

    const scannerUsername = await this.generateUserName(data.supervisorId, supervisor!.username, next);

    const randomPassowrd = await this.generateRandomPassowrd();

    const newScannerUsername = await ScannerUser.create(
      { supervisorId: data.supervisorId, name: scannerUsername as string, password: randomPassowrd },
      { transaction, validate: true },
    );
    if (!newScannerUsername) {
      await transaction.rollback();
      return next(new AppError('cannot create this Scanner User', 400));
    }
    await transaction.commit();
    return { ...newScannerUsername.get({ plain: true }), plainPassword: randomPassowrd };
  });

  public updatenewScannerUsername = catchAsyncReqNext(
    async (req: CustomRequest, next: NextFunction, data: UpdateScannerUserDto) => {
      const isAllowed = validateFieldsNames([...this.scannerUserFields, 'supervisorId', 'id'], Object.keys(data));
      if (isAllowed !== true) {
        return next(
          new AppError(
            `${isAllowed.length === 1 ? 'this field is' : 'these fields are'} not allowed:
          ${isAllowed.join(', ')}`,
            400,
          ),
        );
      }
      if (data.supervisorId) await validateForeignKey(Supervisor, data.supervisorId, 'Supervisor');

      const queryOptions: any = {
        include: { model: Supervisor, as: 'supervisor' },
        where: { id: data.id },
      };
      if (req.supervisorFromReq) queryOptions.where = { ...queryOptions.where, supervisorId: req.supervisorFromReq.id };

      if (data.mobileNumber) {
        const isPhoneNumberValid = await this.verifyPhoneNumber(data.mobileNumber);
        if (isPhoneNumberValid !== true) return next(new AppError(errorMessage('error.phoneNumberNotValid'), 400));
      }
      const transaction = await this.sequelize.transaction();
      const scannerUser = await ScannerUser.findOne({ ...queryOptions, transaction });

      if (!scannerUser) {
        await transaction.rollback();
        return next(new AppError(`ScannerUser with ID ${data.id} not found`, 404));
      }
      await scannerUser.update(data, { transaction });
      await transaction.commit();
      return scannerUser;
    },
  );

  public deleteScannerUser = catchAsyncReqNext(async (req: CustomRequest, next: NextFunction, id: number) => {
    const transaction = await this.sequelize.transaction();

    const queryOptions: any = {
      include: { model: Supervisor, as: 'supervisor' },
      where: { id },
    };
    if (req.supervisorFromReq) queryOptions.where = { ...queryOptions.where, supervisorId: req.supervisorFromReq.id };

    const scannerUser = await ScannerUser.findOne({ ...queryOptions, transaction });

    if (!scannerUser) {
      await transaction.rollback();
      return next(new AppError(`scannerUser with ID ${id} not found`, 404));
    }
    await scannerUser.destroy({ transaction });
    await transaction.commit();
    return { message: `scannerUser with ID ${id} has been deleted successfully` };
  });

  public toggleActivateScannerUser = catchAsyncService(
    async (data: { supervisorId?: number; scannerId: number }, next: NextFunction) => {
      const queryOptions: any = {
        include: [{ model: Supervisor, as: 'supervisor' }],
        where: { id: data.scannerId },
      };
      if (data.supervisorId) queryOptions.where = { ...queryOptions.where, supervisorId: data.supervisorId };

      const scannerUser = await ScannerUser.findOne(queryOptions);

      if (!scannerUser) return next(new AppError(errorMessage('error.scannerUserserNotRegistered'), 404));

      scannerUser.deactivated = !scannerUser.deactivated;
      scannerUser.save({ validate: true });

      return scannerUser;
    },
  );

  public getAllEventsForScanner = catchAsyncReqNext(
    async (req: CustomRequest, next: NextFunction, scannerUserId: number) => {
      const scannerUser = await ScannerUser.findByPk(scannerUserId);
      if (!scannerUser) return next(new AppError('cannot find this scanner user', 404));

      const supervisor = await Supervisor.findByPk(scannerUser.supervisorId);
      if (!supervisor) return next(new AppError('cannot find supervisor for this scanner User', 404));

      const supervisorId = supervisor.id;
      const eventService = (await import('./event.service.js')).default;
      const data = await eventService.getAllEventsForSupervisor(req, next, supervisorId);

      if (!data) return next(new AppError('cannot find evets for this Scanner User', 404));

      return data;
    },
  );

  public updateScannerUserPassword = catchAsyncService(async (data: ChangeScannerPassword, next: NextFunction) => {
    const transaction = await this.sequelize.transaction();
    const scannerSupervisor = await Supervisor.findByPk(data.id, {
      transaction,
      include: [{ model: ScannerUser, as: 'scannerUser' }],
    });

    if (!scannerSupervisor || !scannerSupervisor.scannerUser)
      return next(new AppError('scanner not found for this supervisor', 400));

    const scanner = await ScannerUser.findByPk(scannerSupervisor.scannerUser.id, {
      transaction,
      include: [
        {
          model: Supervisor,
          as: 'supervisor',
        },
      ],
      raw: false,
      nest: true,
    });

    if (!scanner || !scanner.dataValues.supervisor) return next(new AppError('scanner not found', 400));

    const { id, ...restData } = data;
    const parsedData = await updatePassword(null, scanner).safeParseAsync(restData);
    if (!parsedData.success) {
      await transaction.rollback();
      return next(parsedData.error);
    }

    if (!(await scanner.correctPassword(parsedData.data.oldPassword))) {
      await transaction.rollback();
      return next(new AppError(errorMessage('error.incorrectPassword'), 400));
    }

    const sendData = { mobileNumber: scannerSupervisor.mobileNumber, ...data };

    await OTPService.sendOTP(sendData, next, 'scanner_password_reset', transaction, UserTypes.Scanner);

    const otpStatusData = {
      mobileNumber: scanner.dataValues.supervisor.mobileNumber,
      purpose: 'scanner_password_reset',
    };
    const otpStatus = await OTPService.getOTPStatusService(otpStatusData, next, transaction);

    transaction.commit();
    return { ...scanner.toJSON(), otpStatus };
  });

  public confirmUpdateScannerUserPassword = async (
    data: ChangeScannerPassword,
    next: NextFunction,
    transaction: Transaction,
  ) => {
    const scannerSupervisor = await Supervisor.findByPk(data.id, {
      transaction,
      include: [{ model: ScannerUser, as: 'scannerUser' }],
    });

    if (!scannerSupervisor || !scannerSupervisor.scannerUser)
      return next(new AppError('scanner not found for this supervisor', 400));

    const scanner = await ScannerUser.findByPk(scannerSupervisor.scannerUser.id, {
      transaction,
      include: [
        {
          model: Supervisor,
          as: 'supervisor',
        },
      ],
      raw: false,
      nest: true,
    });

    if (!scanner || !scanner.dataValues.supervisor) return next(new AppError('scanner not found', 400));

    const { id, ...restData } = data;
    const parsedData = await updatePassword(null, scanner).safeParseAsync(restData);
    if (!parsedData.success) {
      await transaction.rollback();
      return next(parsedData.error);
    }

    if (!(await scanner.correctPassword(parsedData.data.oldPassword))) {
      await transaction.rollback();
      return next(new AppError(errorMessage('error.incorrectPassword'), 400));
    }

    scanner.password = data.password;
    await scanner.save({ transaction });
    // transaction.commit();
    return scanner;
  };

  public uploadSingleImageForScannerUserService = upload.single('scannerUserPhoto');

  public saveScannerUserImageOnUpdate = catchAsyncReqNext(async (req: CustomRequest, next: NextFunction) => {
    const supervisorId = req.supervisorFromReq?.id;

    if (!supervisorId) return next(new AppError('Supervisor not found in the context', 401));

    const fileName = new URL(path.join('scannerUserPhoto', req.body.scannerUserPhoto), pathName).href;
    req.body.scannerUserPhoto = fileName;
  });

  public async canScanEvent(typedUserId: number, eventId: number, type: string): Promise<boolean> {
    let result: boolean = false;
    if (type === 'scan') {
      const scannerUser = await ScannerUser.findOne({
        where: { id: typedUserId },
        include: [
          {
            model: Supervisor,
            as: 'supervisor',
            include: [
              {
                model: Event,
                as: 'events',
                where: { id: eventId },
              },
            ],
          },
        ],
      });
      if (
        !scannerUser ||
        !scannerUser.get({ plain: true }).supervisor ||
        !scannerUser.get({ plain: true }).supervisor.events
      )
        return false;

      return scannerUser.get({ plain: true }).supervisor.events.length > 0;
    }
    if (type === 'supervisor') {
      const supervisor = await Supervisor.findOne({
        where: { id: typedUserId },
        include: [
          {
            model: Event,
            as: 'events',
            where: { id: eventId },
          },
        ],
      });

      if (!supervisor || !supervisor.get({ plain: true }).events) return false;

      return supervisor.get({ plain: true }).events!.length > 0;
    } else return result;
  }

  private async verifyPhoneNumber(mobileNumber: string) {
    if (mobileNumber.length !== 12) return false;
    if (mobileNumber.substring(0, 3) !== '963') return false;
    for (let i = 3; i < 11; i += 1) {
      if (!/\d/.test(mobileNumber[i])) return false;
    }
    return true;
  }

  private async generateRandomPassowrd() {
    const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
    const numericChars = '0123456789';
    const allChars = uppercaseChars + lowercaseChars + numericChars;

    const passwordParts = [
      uppercaseChars.charAt(Math.floor(Math.random() * uppercaseChars.length)),
      lowercaseChars.charAt(Math.floor(Math.random() * lowercaseChars.length)),
      '@',
    ];

    for (let i = 0; i < 7; i++) {
      passwordParts.push(allChars.charAt(Math.floor(Math.random() * allChars.length)));
    }

    return passwordParts.sort(() => Math.random() - 0.5).join('');
  }

  private async generateUserName(id: number, username: string, next: NextFunction) {
    let scannerUserName = '';
    const scannerUser = await ScannerUser.findAll({ where: { supervisorId: id } });
    if (!scannerUser) return next(new AppError('cannot create another scanner user', 400));
    scannerUserName = `${username}-scan`;

    return scannerUserName;
  }

  private async verifyscannerUserName(username: string): Promise<boolean> {
    const regex = /^[a-zA-Z]{2,}-[a-zA-Z]{2,}-\d{5}-scan$/;
    return regex.test(username);
  }

  private scannerUserFields = ['scannerUserPhoto', 'mobileNumber', 'supervisorId'];
}

export default new ScannerUserService(sequelize);
