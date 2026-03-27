import { NextFunction } from 'express';
import { Sequelize, Transaction } from 'sequelize';
import crypto from 'crypto';
import QRCode from 'qrcode';
import { Client, LocalAuth } from 'whatsapp-web.js';
import { sequelize } from '../DB/sequelize';
import AppError from '../utils/AppError';
import { commonMessage, errorMessage } from '../modules/i18next.config';
import UserTypes from '../common/enums/userTypes.enum';
import Otp, { OtpPurpose } from '../models/OTPCode.model';
import WhatsAppSession from '../models/whatsAppSession.model';
import authService from './auth.service';
import supervisorService from './supervisor.service';
import scannerUserService from './scannerUser.service';
import { RegisterUserDto } from '../interfaces/auth/registerUser.dto';
import { LoginUserDto } from '../interfaces/auth/loginUser.dto';
// import { LoginSupervisorDto } from '../interfaces/supervisor/loginSupervisor.dto';
import { ChangeScannerPassword } from '../interfaces/scannerUser/changePassword.dto';
import { ForgetSupervisorPassword } from '../interfaces/supervisor/resetPassword.dto';
import { ChangeSupervisorPassword } from '../interfaces/supervisor/changePassword.dto';
import normalUserService from './normalUser.service';

class OTPService {
  private sequelize: Sequelize;

  private waClient: Client | null = null;

  private waIsReady = false;

  private latestQrCode: string | null = null;

  private waInitPromise: Promise<void> | null = null;

  private readonly waSessionKey = process.env.WA_OTP_CLIENT_ID || 'otp-service';

  constructor(sequelize: Sequelize) {
    this.sequelize = sequelize;
  }

  private async getOrCreateWaSession() {
    const [session] = await WhatsAppSession.findOrCreate({
      where: { sessionKey: this.waSessionKey },
      defaults: {
        sessionKey: this.waSessionKey,
        sessionData: null,
        qrCode: null,
        isReady: false,
      },
    });
    return session;
  }

  private async initializeWhatsAppClient() {
    if (this.waInitPromise) return this.waInitPromise;

    this.waInitPromise = (async () => {
      const storedSession = await this.getOrCreateWaSession();

      this.waClient = new Client({
        authStrategy: new LocalAuth({ clientId: this.waSessionKey }),
        puppeteer: {
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        },
      });

      this.waClient.on('qr', async (qr) => {
        this.waIsReady = false;
        this.latestQrCode = await QRCode.toDataURL(qr);
        await storedSession.update({
          qrCode: this.latestQrCode,
          isReady: false,
        });
      });

      this.waClient.on('authenticated', async () => {
        await storedSession.update({
          // LocalAuth stores the actual session on disk; DB keeps only lightweight status metadata.
          sessionData: { provider: 'LocalAuth', authenticatedAt: new Date().toISOString() },
        });
      });

      this.waClient.on('ready', async () => {
        this.waIsReady = true;
        this.latestQrCode = null;
        await storedSession.update({
          qrCode: null,
          isReady: true,
          lastConnectedAt: new Date(),
        });
      });

      this.waClient.on('auth_failure', async () => {
        this.waIsReady = false;
        await storedSession.update({
          sessionData: null,
          isReady: false,
        });
      });

      this.waClient.on('disconnected', async () => {
        this.waIsReady = false;
        await storedSession.update({ isReady: false });
      });

      await this.waClient.initialize();
    })();

    return this.waInitPromise;
  }

  public async getWhatsAppWebStatus(_next?: NextFunction) {
    try {
      await this.initializeWhatsAppClient();
      const storedSession = await this.getOrCreateWaSession();

      return {
        isReady: this.waIsReady || storedSession.isReady,
        hasStoredSession: !!storedSession.sessionData,
        qrCode: this.latestQrCode || storedSession.qrCode,
        lastConnectedAt: storedSession.lastConnectedAt,
      };
    } catch (error: any) {
      throw new AppError(error?.message || 'Cannot initialize WhatsApp Web client', 500);
    }
  }

  private async sendWhatsAppMessage(phone: string, message: string, next: NextFunction) {
    await this.initializeWhatsAppClient();

    if (!this.waClient || !this.waIsReady) {
      const status = await this.getWhatsAppWebStatus(next);
      throw new AppError(
        `WhatsApp Web is not ready yet. Please scan QR first.${status && typeof status === 'object' && status.qrCode ? ' qrCode is available in /otp/whatsapp/status' : ''}`,
        503,
      );
    }

    const chatId = `${phone}@c.us`;
    await this.waClient.sendMessage(chatId, message);
  }

  public async getOTPStatus(data: { mobileNumber?: string; username?: string; purpose: string }, next: NextFunction) {
    if (!data.mobileNumber && !data.username) throw next(new AppError('mobile number or username are missing', 400));
    if (!data.purpose) return next(new AppError('purpose is missing', 400));

    let supervisor;
    let user;

    if (data.mobileNumber) {
      user = await normalUserService.getOneNormalUserByMobileNumber(data.mobileNumber);
    }
    if (user && user.blocked) return next(new AppError(errorMessage('error.blockedAccount'), 403));

    if (data.username) {
      supervisor = await supervisorService.getOneSupervisorService(data.username, next);
    }
    if (supervisor && supervisor.blocked) return next(new AppError(errorMessage('error.blockedAccount'), 403));
    // if (supervisor && supervisor.deactivated) return next(new AppError(errorMessage('error.deactivatedAccount'), 403));

    if (supervisor) data.mobileNumber = supervisor.mobileNumber;

    const otpStatus = await Otp.findOne({
      where: { mobileNumber: data.mobileNumber, purpose: data.purpose },
      order: [['createdAt', 'DESC']],
    });
    const now = new Date();

    if (otpStatus && !otpStatus.verifiedAt && otpStatus.expiresAt < now) return otpStatus;
    return null;
  }

  public async getOTPStatusService(
    data: { mobileNumber: string; purpose: string },
    next: NextFunction,
    transaction: Transaction,
  ) {
    if (!data.mobileNumber || !data.purpose) {
      await transaction.rollback();
      return next(new AppError('mobile number or purpose are missing', 400));
    }
    const otpStatus = await Otp.findOne({
      where: { mobileNumber: data.mobileNumber, purpose: data.purpose },
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['signupData', 'codeHash'] },
      transaction,
    });
    if (otpStatus && !otpStatus.verifiedAt) return otpStatus;
    return null;
  }

  public async sendOTP(data: any, next: NextFunction, purpose: string, transaction: Transaction, userType: UserTypes) {
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const otpCode = crypto.randomInt(100000, 999999).toString();

    try {
      const existingOtp = await Otp.findOne({
        where: { mobileNumber: data.mobileNumber, purpose, userType },
        order: [['updatedAt', 'DESC']],
        transaction,
      });
      const nextAllowed = new Date(new Date().getTime() + 1 * 60 * 1000);
      if (existingOtp) {
        // let minutesToWait = 1;
        // if (existingOtp.retries === 2) minutesToWait = 5;
        // if (existingOtp.retries === 3) minutesToWait = 15;
        // if (existingOtp.retries === 5) minutesToWait = 60;

        await existingOtp.update(
          {
            codeHash: otpCode,
            expiresAt,
            signupData: { ...data },
            retries: 0,
            // minutesToWait,
            nextAllowed,
            verifiedAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          { transaction },
        );
      } else {
        // const nextAllowed = new Date(new Date().getTime() + 1 * 60 * 1000);
        await Otp.create(
          {
            mobileNumber: data.mobileNumber,
            codeHash: otpCode,
            expiresAt,
            signupData: { ...data },
            purpose: purpose as OtpPurpose,
            userType,
            nextAllowed,
            verifiedAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          { transaction },
        );
      }

      let success = false;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          await this.sendWhatsAppMessage(data.mobileNumber, commonMessage('common.sendOTP', { Code: otpCode }), next);
          success = true;
          break;
        } catch (err) {
          await new Promise((res) => setTimeout(res, 100));
        }
      }
      if (!success) {
        await transaction.rollback();
        return next(new AppError(errorMessage('error.CannotSendOTP'), 400));
      }
      return true;
    } catch (error: any) {
      await transaction.rollback();
      throw new AppError(error, 400);
    }
  }

  public async resendOTP(data: { purpose: string; mobileNumber: string }, next: NextFunction) {
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const otpCode = crypto.randomInt(100000, 999999).toString();

    const transaction = await sequelize.transaction();
    try {
      const existingOtp = await Otp.findOne({
        where: { mobileNumber: data.mobileNumber, purpose: data.purpose },
        order: [['updatedAt', 'DESC']],
        transaction,
      });
      if (!existingOtp) {
        await transaction.rollback();
        throw next(new AppError(errorMessage('error.OTPNotFound'), 429));
      }
      let minutesToWait = 5;
      // if (existingOtp.retries === 0) minutesToWait = 1;
      if (existingOtp.retries === 1) minutesToWait = 5;
      if (existingOtp.retries === 3) minutesToWait = 15;
      if (existingOtp.retries === 5) minutesToWait = 60;

      const nextAllowed = existingOtp.nextAllowed;

      if (nextAllowed > new Date()) {
        await transaction.rollback();
        throw next(new AppError(errorMessage('error.OTPWaitTime'), 429));
      }

      const { purpose, ...neededData } = data;
      await existingOtp.update(
        {
          codeHash: otpCode,
          expiresAt,
          // signupData: { ...neededData },
          retries: existingOtp.retries! + 1,
          minutesToWait: minutesToWait,
          nextAllowed: new Date(new Date().getTime() + minutesToWait * 60 * 1000),
        },
        { transaction },
      );

      let success = false;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          await this.sendWhatsAppMessage(data.mobileNumber, commonMessage('common.sendOTP', { Code: otpCode }), next);
          success = true;
          break;
        } catch (err) {
          await new Promise((res) => setTimeout(res, 100));
        }
      }

      if (!success) {
        await transaction.rollback();
        throw next(new AppError(errorMessage('error.CannotSendOTP'), 400));
      }

      await existingOtp.reload({ transaction });

      await transaction.commit();
      return existingOtp;
    } catch (error: any) {
      await transaction.rollback();
      throw new AppError(error, 400);
    }
  }

  public async verifyOtp(data: { code: string; mobileNumber: string; purpose: string }, next: NextFunction) {
    const { code, mobileNumber, purpose } = data;

    const transaction = await sequelize.transaction();

    const otpRecord = await Otp.findOne({ where: { mobileNumber, purpose, verifiedAt: null }, transaction });
    if (!otpRecord) {
      await transaction.rollback();
      return next(new AppError(errorMessage('error.OTPNotFound'), 400));
    }

    if (!(await otpRecord.correctOTPCode(code))) {
      await transaction.rollback();
      return next(new AppError(errorMessage('error.invalidOTPCode'), 400));
    }

    const now = new Date();

    if (otpRecord.expiresAt < now) {
      await transaction.rollback();
      return next(new AppError(errorMessage('error.OTPCodeExpired'), 400));
    }

    if (purpose === 'signup') {
      await authService.confirmRegister(otpRecord.signupData as RegisterUserDto, next, transaction);
    } else if (purpose === 'login') {
      await authService.confirmLogin(otpRecord.signupData as LoginUserDto, next, transaction);
    } else if (purpose === 'supervisor_login') {
      await supervisorService.confirmLogin(otpRecord.signupData as LoginUserDto, next, transaction);
    } else if (purpose === 'spervisor_password_reset') {
      await supervisorService.confirmUpdateSupervisorPassword(
        otpRecord.signupData as ChangeSupervisorPassword,
        next,
        transaction,
      );
    } else if (purpose === 'supervisor_forget_password') {
      await supervisorService.confirmForgetSupervisorPassword(
        otpRecord.signupData as ForgetSupervisorPassword,
        next,
        transaction,
      );
    } else if (purpose === 'scanner_password_reset') {
      await scannerUserService.confirmUpdateScannerUserPassword(
        otpRecord.signupData as ChangeScannerPassword,
        next,
        transaction,
      );
    } else {
      await transaction.rollback();
      return next(new AppError('Not Allowed Method !!', 400));
    }

    otpRecord.verifiedAt = new Date();
    await otpRecord.save({ transaction });

    await transaction.commit();
    return otpRecord;
  }

  public sendSupervisorSignUpMessage = async (data: any, next: NextFunction) => {
    let success = false;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await this.sendWhatsAppMessage(
          data.mobileNumber,
          commonMessage('common.sendSupervisorSignUpMessage', {
            supervisor: data.supervisor,
            supervisorPassword: data.supervisorPassword,
            scannerUser: data.scannerUser,
            scannerUserPassword: data.scannerUserPassword,
          }),
          next,
        );
        success = true;
        break;
      } catch (err) {
        await new Promise((res) => setTimeout(res, 100));
      }
    }
    if (!success) {
      // await transaction.rollback();
      return next(new AppError(errorMessage('error.CannotSendOTP'), 400));
    }
    return true;
  };
}

export default new OTPService(sequelize);
