import { NextFunction } from 'express';
import { Sequelize, Transaction } from 'sequelize';
import User from '../models/user.model';
import NormalUser from '../models/normalUser.model';
import UserEventType from '../models/userEventType.model.js';
import UserProvince from '../models/userProvince.model.js';
import { LoginUserDto } from '../interfaces/auth/loginUser.dto';
import { RegisterUserDto } from '../interfaces/auth/registerUser.dto';
import AppError from '../utils/AppError.js';
import catchAsyncService from '../utils/catchAsyncService.js';
import validateFieldsNames from '../utils/validateFields.js';
import { errorMessage } from '../modules/i18next.config';
import { registerUserSchema } from '../modules/zodValidation/normalUser/registerNormalUser.config';
import OTPService from './OTP.service';

export class AuthService {
  private sequelize: Sequelize;

  constructor(sequelize: Sequelize) {
    this.sequelize = sequelize;
  }

  public register = async (data: RegisterUserDto, next: NextFunction) => {
    const parsedData = await registerUserSchema.safeParseAsync(data);
    if (!parsedData.success) {
      return next(parsedData.error);
    }

    const transaction = await this.sequelize.transaction();

    await OTPService.sendOTP(data, next, 'signup', transaction, UserTypes.NormalUser);

    const otpStatusData = { mobileNumber: data.mobileNumber, purpose: 'signup' };
    const otpStatus = await OTPService.getOTPStatusService(otpStatusData, next, transaction);

    await transaction.commit();

    const returnedUser = {
      mobileNumber: data.mobileNumber,
      firstName: data.firstName,
      lastName: data.lastName,
      gender: data.gender,
      otpStatus,
    };
    return returnedUser;
  };

  public confirmRegister = async (data: RegisterUserDto, next: NextFunction, transaction: Transaction) => {
    const parsedData = await registerUserSchema.safeParseAsync(data);
    if (!parsedData.success) {
      await transaction.rollback();
      return next(parsedData.error);
    }

    const user = User.build({
      firstName: data.firstName,
      lastName: data.lastName,
      lastLogin: new Date(Date.now()),
    });
    user.lastLogin = new Date();
    await user.save({ transaction });

    const normalUser = NormalUser.build({
      mobileNumber: data.mobileNumber,
      gender: data.gender,
      birthDate: data.birthDate,
      userId: user.id,
      acceptRateAppNotification: false,
    });
    await normalUser.save({ transaction });

    const userEventTypes = data.eventTypeId?.map((eventId) =>
      UserEventType.build({ userId: normalUser.id, eventTypeId: eventId }),
    );
    const userProvinces = data.provinces?.map((provinceId) =>
      UserProvince.build({ userId: normalUser.id, provinceId }),
    );

    await Promise.all([
      ...userEventTypes.map((uet) => uet.save({ transaction })),
      ...userProvinces.map((up) => up.save({ transaction })),
    ]);
    // await transaction.commit();

    const returnedUser = {
      mobileNumber: normalUser.mobileNumber,
      firstName: user.firstName,
      lastName: user.lastName,
      gender: normalUser.gender,
      age: normalUser.age,
      userId: normalUser.userId,
    };
    return returnedUser;
  };

  public login = catchAsyncService(async (data: LoginUserDto, next: NextFunction) => {
    const isAllowed = validateFieldsNames(this.allowedLoginFields, Object.keys(data));
    if (isAllowed !== true) {
      return next(
        new AppError(
          `${isAllowed.length === 1 ? 'this field is' : 'these fields are'} not allowed:
          ${isAllowed.join(', ')}`,
          400,
        ),
      );
    }
    if (!data.mobileNumber) return next(new AppError(errorMessage('error.phoneNumberEmpty'), 400));

    const isPhoneNumberValid = await this.verifyPhoneNumber(data.mobileNumber);
    if (isPhoneNumberValid !== true) return next(new AppError(errorMessage('error.phoneNumberNotValid'), 400));

    const transaction = await this.sequelize.transaction();

    const normalUser = await NormalUser.findOne({
      include: {
        model: User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'lastLogin'],
      },
      where: { mobileNumber: data.mobileNumber },
      attributes: ['mobileNumber', 'gender', 'blocked'],
      transaction,
    });
    if (!normalUser) {
      await transaction.rollback();
      return next(new AppError(errorMessage('error.userNotRegistered'), 400));
    }
    if (!normalUser?.user) {
      await transaction.rollback();
      return next(new AppError(errorMessage('error.userNotFound'), 400));
    }

    if (normalUser.blocked) {
      await transaction.rollback();
      return next(new AppError(errorMessage('error.blockedAccount'), 403));
    }

    await OTPService.sendOTP(data, next, 'login', transaction, UserTypes.NormalUser);

    const otpStatusData = { mobileNumber: data.mobileNumber, purpose: 'login' };
    const otpStatus = await OTPService.getOTPStatusService(otpStatusData, next, transaction);

    await transaction.commit();
    const normalUserRes = {
      // otpOd: otpCode.id,
      mobileNumber: normalUser.mobileNumber,
      gender: normalUser.gender,
      user: {
        firstName: normalUser.user.firstName,
        lastName: normalUser.user.lastName,
        lastLogin: normalUser.user.lastLogin,
      },
      otpStatus,
    };

    return normalUserRes;
  });
  public confirmLogin = async (data: LoginUserDto, next: NextFunction, transaction: Transaction) => {
    console.log(data);
    const isAllowed = validateFieldsNames(this.allowedLoginFields, Object.keys(data));
    if (isAllowed !== true) {
      return next(
        new AppError(
          `${isAllowed.length === 1 ? 'this field is' : 'these fields are'} not allowed:
          ${isAllowed.join(', ')}`,
          400,
        ),
      );
    }
    if (!data.mobileNumber) return next(new AppError(errorMessage('error.phoneNumberEmpty'), 400));

    const isPhoneNumberValid = await this.verifyPhoneNumber(data.mobileNumber);
    if (isPhoneNumberValid !== true) return next(new AppError(errorMessage('error.phoneNumberNotValid'), 400));

    const normalUser = await NormalUser.findOne({
      include: {
        model: User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'lastLogin'],
      },
      where: { mobileNumber: data.mobileNumber },
      attributes: ['mobileNumber', 'gender'],
      transaction,
    });
    if (!normalUser) {
      await transaction.rollback();
      return next(new AppError(errorMessage('error.userNotRegistered'), 400));
    }
    if (!normalUser?.user) {
      await transaction.rollback();
      return next(new AppError(errorMessage('error.userNotFound'), 400));
    }
    (normalUser?.user as User).lastLogin = new Date();
    await (normalUser?.user as User).save({
      fields: ['lastLogin'],
      silent: true,
      transaction,
    });
    const normalUserRes = {
      mobileNumber: normalUser.mobileNumber,
      gender: normalUser.gender,
      user: {
        firstName: normalUser.user.firstName,
        lastName: normalUser.user.lastName,
        lastLogin: normalUser.user.lastLogin,
      },
    };
    return normalUserRes;
  };

  private async verifyPhoneNumber(mobileNumber: string) {
    if (mobileNumber.length !== 12) return false;
    if (mobileNumber.substring(0, 3) !== '963') return false;
    for (let i = 3; i < 11; i += 1) {
      if (!/\d/.test(mobileNumber[i])) return false;
    }
    return true;
  }

  private allowedLoginFields: string[] = ['mobileNumber'];
}

import { sequelize } from '../DB/sequelize.js';
import UserTypes from '../common/enums/userTypes.enum';
export default new AuthService(sequelize);
