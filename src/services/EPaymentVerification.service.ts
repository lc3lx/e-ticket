import PaymentVerification from '../models/EPaymentVerification.model.js';
import { PAYMENT_METHOD_RULES, PaymentServiceName } from '../config/EPaymentMethodsRules.config.js';
import { Sequelize, Transaction } from 'sequelize';
import AppError from '../utils/AppError.js';

class PaymentVerificationService {
  private sequelize: Sequelize;

  constructor(sequelize: Sequelize) {
    this.sequelize = sequelize;
  }

  public async getExistingVerification(serviceName: PaymentServiceName, bookId: number) {
    const rule = PAYMENT_METHOD_RULES[serviceName];
    if (!rule) throw new AppError(`Unsupported service: ${serviceName}`, 404);

    const existing = await PaymentVerification.findOne({
      where: { serviceName, bookId },
    });
    if (existing) {
      return existing;
    }
    return null;
  }

  public async getExistingVerificationService(
    serviceName: PaymentServiceName,
    bookId: number,
    transaction: Transaction,
  ) {
    const rule = PAYMENT_METHOD_RULES[serviceName];
    if (!rule) throw new AppError(`Unsupported service: ${serviceName}`, 404);

    const existing = await PaymentVerification.findOne({
      where: { serviceName, bookId },
      transaction,
    });

    if (existing) {
      return existing;
    }
    return null;
  }

  public async changeEPaymentVerificationStatusService(
    serviceName: PaymentServiceName,
    bookId: number,
    transaction: Transaction,
  ) {
    const rule = PAYMENT_METHOD_RULES[serviceName];
    if (!rule) {
      // await transaction.rollback();
      throw new AppError(`Unsupported service: ${serviceName}`, 404);
    }

    const existing = await PaymentVerification.findOne({
      where: { serviceName, bookId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    const now = new Date();

    if (!existing) {
      const expiresAt = new Date(now.getTime() + rule.codeExpireMinutes * 60_000);
      const nextAllowed = new Date(now.getTime() + rule.resendWaitMinutes * 60_000);
      const created = await PaymentVerification.create(
        {
          serviceName,
          bookId,
          expiresAt,
          nextAllowed,
          retries: 0,
          minutesToWait: rule.resendWaitMinutes,
          verifiedAt: null,
        },
        { transaction },
      );

      return created;
    }

    if (existing.verifiedAt) {
      // await transaction.rollback();
      throw new AppError(errorMessage('error.paymentAlreadyVerified'), 400);
    }

    if (existing.nextAllowed.getTime() > now.getTime()) {
      const waitSeconds = Math.ceil((existing.nextAllowed.getTime() - now.getTime()) / 1000);
      // await transaction.rollback();
      throw new AppError(errorMessage('error.resendWaiting', { waitSeconds }), 400);
    }

    if (existing.retries >= rule.maxRetries) {
      // await transaction.rollback();
      throw new AppError(errorMessage('error.maximumRetriesReaches'), 400);
    }

    const newNextAllowed = new Date(now.getTime() + rule.resendWaitMinutes * 60_000);

    await existing.update(
      {
        retries: existing.retries + 1,
        nextAllowed: newNextAllowed,
        expiresAt: new Date(now.getTime() + rule.codeExpireMinutes * 60_000),
      },
      { transaction },
    );

    return existing;
  }
}

import { sequelize } from '../DB/sequelize.js';
import { errorMessage } from '../modules/i18next.config.js';
export default new PaymentVerificationService(sequelize);
