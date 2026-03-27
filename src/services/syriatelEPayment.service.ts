import { Sequelize, Transaction } from 'sequelize';
import axios from 'axios';
import { NextFunction, Request } from 'express';
import SyriatelEPayment from '../models/SyriatelEPayment.model';
import SyriatelEPaymentToken from '../models/SyriatelEPaymentToken.model';
import { CustomRequest } from '../interfaces/auth/extendRequest.dto';
import AppError from '../utils/AppError.js';
import { errorMessage } from '../modules/i18next.config.js';
import APIFeatures from '../utils/apiFeatures';
import { sequelize } from '../DB/sequelize.js';
import SyriatelPaymentTestAPIS from '../common/enums/SyriatelPaymentAPISTest.enum';
import SyriatelPaymentAPIS from '../common/enums/SyriatelPaymentAPIS.enum';
import SyriatelEPaymentStatus from '../common/enums/SyriatelEPaymentStatus.enum';
import cron from 'node-cron';
import { SyriatelInitPaymentDTO } from '../interfaces/ePayment/Syriatel/initPayment.dto';
import { generateTransactionID } from '../utils/onlinePaymentPrepare';

export class SyriatelEPaymentService {
  private sequelize: Sequelize;
  private lastImmediateRun: Date | null = null;

  constructor(sequelize: Sequelize) {
    this.sequelize = sequelize;
    this.initializeJobs();
  }

  public async getToken(): Promise<string | null> {
    try {
      const tokenData = { username: process.env.SYRIATEL_USERNAME, password: process.env.SYRIATEL_PASSWORD };
      const getToken = await axios.post(SyriatelPaymentTestAPIS.GETTOKEN, tokenData, {
        headers: { 'Content-Type': 'application/json' },
      });
      if (getToken.data.errorCode !== '0') {
        throw new AppError(getToken.data.errorDesc, 400);
      }
      const existing = await SyriatelEPaymentToken.findOne({ where: { username: process.env.SYRIATEL_USERNAME! } });

      if (!existing)
        await SyriatelEPaymentToken.create({
          username: process.env.SYRIATEL_USERNAME!,
          password: process.env.SYRIATEL_PASSWORD!,
          token: getToken.data.token,
          errorCode: getToken.data.errorCode,
          errorDesc: getToken.data.errorDesc,
          merchantMSISDN: process.env.SYRIATEL_MARCHANT_MSISDN!,
          expiredAt: new Date(Date.now() + 15 * 30 * 1000),
        });

      if (existing) {
        const updated = await existing.update({
          token: getToken.data.token,
          errorCode: getToken.data.errorCode,
          errorDesc: getToken.data.errorDesc,
          expiredAt: new Date(Date.now() + 15 * 30 * 1000),
        });
      }

      const token = getToken.data.token;
      return token;
    } catch (error: any) {
      console.error('Token fetch failed:', error.message);
      throw new AppError(error.message, 400);
    }
  }

  public requestPayment = async (
    paymentRequestData: SyriatelInitPaymentDTO,
    transaction: Transaction,
    next: NextFunction,
  ) => {
    const tokenData = await this.getCurrentToken();
    if (!tokenData) {
      throw new AppError(errorMessage('error.syriatelTokenNotFound'), 400);
    }

    try {
      const transactionID: string = generateTransactionID();

      const requestPaymentData = {
        customerMSISDN: paymentRequestData.customerMSISDN,
        merchantMSISDN: tokenData.merchantMSISDN,
        amount: paymentRequestData.amount,
        transactionID: transactionID,
        token: tokenData.token,
      };
      const requestPayment = await axios.post(SyriatelPaymentTestAPIS.PAYMENTREQUEST, requestPaymentData, {
        headers: { 'Content-Type': 'application/json' },
      });
      if (requestPayment.data.errorCode !== '0') {
        throw new AppError(requestPayment.data.errorDesc, 400);
      }

      const requestPaymentLocalData = {
        errorCode: requestPayment.data.errorCode,
        errorDesc: requestPayment.data.errorDesc,
        bookId: Number(paymentRequestData.bookId),
        status: SyriatelEPaymentStatus.INIT,
        customerMSISDN: paymentRequestData.customerMSISDN,
        amount: String(paymentRequestData.amount),
        transactionID,
        paymentMethodId: paymentRequestData.paymentMethodId,
      };
      const requestPaymentLocal = await SyriatelEPayment.create(requestPaymentLocalData, { transaction });

      return requestPaymentLocal;
    } catch (error: any) {
      console.error('request Payment failed:', error.message);
      throw new AppError(error.message, 400);
    }
  };

  public confirmPayment = async (
    paymentConfirmData: { OTP: string; bookId: number },
    transaction: Transaction,
    next: NextFunction,
  ) => {
    const tokenData = await this.getCurrentToken();
    if (!tokenData) {
      throw new AppError(errorMessage('error.syriatelTokenNotFound'), 400);
    }

    try {
      const paymentRequestData = await this.getOnePayment(paymentConfirmData.bookId, transaction);
      if (!paymentRequestData) throw new AppError(errorMessage('error.syriatelPaymentRequestNotFound'), 400);

      const confirmPaymentData = {
        OTP: paymentConfirmData.OTP,
        merchantMSISDN: tokenData.merchantMSISDN,
        transactionID: paymentRequestData.transactionID,
        token: tokenData.token,
      };
      const confirmPayment = await axios.post(SyriatelPaymentTestAPIS.PAYMENTCONFIRM, confirmPaymentData, {
        headers: { 'Content-Type': 'application/json' },
      });
      if (confirmPayment.data.errorCode !== '0') {
        throw new AppError(confirmPayment.data.errorDesc, 400);
      }

      const confirmPaymentLocalData = {
        errorCode: confirmPayment.data.errorCode,
        errorDesc: confirmPayment.data.errorDesc,
        status: SyriatelEPaymentStatus.SUCCESS,
      };
      const confirmPaymentLocal = await paymentRequestData.update(confirmPaymentLocalData, { transaction });

      return confirmPaymentLocal;
    } catch (error: any) {
      console.error('confirm Payment failed:', error.message);
      throw new AppError(error.message, 400);
    }
  };

  public resendCode = async (paymentResendData: { bookId: number }, transaction: Transaction, next: NextFunction) => {
    const tokenData = await this.getCurrentToken();
    if (!tokenData) {
      throw new AppError(errorMessage('rerror.syriatelTokenNotFound'), 400);
    }

    try {
      const paymentRequestData = await this.getOnePayment(paymentResendData.bookId, transaction);
      if (!paymentRequestData) throw new AppError(errorMessage('error.syriatelPaymentRequestNotFound'), 400);

      const resendCodePaymentData = {
        merchantMSISDN: tokenData.merchantMSISDN,
        transactionID: paymentRequestData.transactionID,
        token: tokenData.token,
      };
      const confirmPayment = await axios.post(SyriatelPaymentTestAPIS.RESENDCODE, resendCodePaymentData, {
        headers: { 'Content-Type': 'application/json' },
      });
      if (confirmPayment.data.errorCode !== '0') {
        // await transaction.rollback();
        throw new AppError(confirmPayment.data.errorDesc, 400);
      }

      const confirmPaymentLocalData = {
        errorCode: confirmPayment.data.errorCode,
        errorDesc: confirmPayment.data.errorDesc,
        status: SyriatelEPaymentStatus.SUCCESS,
      };
      const confirmPaymentLocal = await paymentRequestData.update(confirmPaymentLocalData, { transaction });

      return confirmPaymentLocal;
    } catch (error: any) {
      console.error('request Payment failed:', error.message);
      throw new AppError(error.message, 400);
    }
  };

  private getOnePayment = async (bookId: number, transaction: Transaction) => {
    const paymentRequest = await SyriatelEPayment.findOne({ where: { bookId } });

    return paymentRequest;
  };

  private getCurrentToken = async () => {
    const tokenData = await SyriatelEPaymentToken.findOne();
    if (!tokenData) throw new AppError(errorMessage('error.syriatelTokenNotFound'), 400);
    return tokenData;
  };

  private initializeJobs() {
    this.runImmediate();

    cron.schedule('*/15 * * * *', async () => {
      try {
        await this.getToken();
        console.log('(Syriatel EPayment Token Timer) Token refreshed via cron');
      } catch (error) {
        console.error('Cron job failed:', (error as Error).message);
      }
    });
  }

  private async runImmediate() {
    if (this.lastImmediateRun && new Date().getTime() - this.lastImmediateRun.getTime() < 60_000) {
      console.log(
        '(Syriatel EPayment Token Timer) Skipped immediate event timer: Recent run at',
        this.lastImmediateRun.toISOString(),
      );
      return;
    }
    try {
      await this.getToken();
      this.lastImmediateRun = new Date();
      console.log(
        '(Syriatel EPayment Token Timer) Immediate event timer executed at',
        this.lastImmediateRun.toISOString(),
      );
    } catch (error: Error | unknown) {
      console.error('(Syriatel EPayment Token Timer) Immediate event timer failed:', (error as Error).message);
    }
  }
}

export default new SyriatelEPaymentService(sequelize);
