import { Sequelize, Transaction } from 'sequelize';
import axios from 'axios';
import { NextFunction, Request } from 'express';
import { CustomRequest } from '../interfaces/auth/extendRequest.dto';
import MTNEPayment from '../models/MTNEPayment.model';
import AppError from '../utils/AppError.js';
import { errorMessage } from '../modules/i18next.config.js';
import { createInvoice } from '../modules/zodValidation/ePayment/MTN/createInvoice.config';
import { CreateMTNInvoiceDTO } from '../interfaces/ePayment/MTN/createInvoice.dto';
import { digitalSign } from '../utils/digitalSign';
import MTNPaymentAPIS from '../common/enums/MTNPaymentAPIS.enum';
import MTNRequestNames from '../common/enums/MTNRequestNames.enum';
import { initPayment } from '../modules/zodValidation/ePayment/MTN/initPayment.config';
import { InitPaymentDTO } from '../interfaces/ePayment/MTN/initPayment.dto';
import { confirmPayment } from '../modules/zodValidation/ePayment/MTN/confirmPayment.config';
import { ConfirmPaymentDTO } from '../interfaces/ePayment/MTN/confirmPayment.dto';
import { generateGuid, hashCode } from '../utils/onlinePaymentPrepare.js';
import allPaymentService from './allEPayment.service';
import catchAsyncReqNext from '../utils/catchAsyncReqNext';
import APIFeatures from '../utils/apiFeatures';

export class MTNEPaymentService {
  private sequelize: Sequelize;

  constructor(sequelize: Sequelize) {
    this.sequelize = sequelize;
  }

  public getAllInvoices = catchAsyncReqNext(async (req: CustomRequest, next: NextFunction) => {
    const features = new APIFeatures(MTNEPayment, req.query as Record<string, string>)
      .filter()
      .search()
      .sort()
      .limitFields()
      .paginate();

    const totalCount = await MTNEPayment.count({ where: features.query.where });
    const data = await features.execute();

    return {
      page: features.page,
      totalPages: Math.ceil(totalCount / features.limit),
      totalItemsInPage: data.length,
      limit: features.limit,
      totalCount,
      data,
      hasPreviousPage: features.page > 1,
      hasNextPage: features.page < Math.ceil(totalCount / features.limit),
    };
  });

  public createInvoice = async (
    data: CreateMTNInvoiceDTO,
    bookId: number,
    language: 'ar' | 'en',
    transaction: Transaction,
    next: NextFunction,
  ) => {
    try {
      const parsedData = await createInvoice.safeParseAsync(data);
      if (!parsedData.success) {
        await transaction.rollback();
        return next(parsedData.error);
      }

      const paymentMethodId = await allPaymentService.getOnePaymentService('MTN', transaction, next);

      const createData = { gatewayType: 'MTN', ...data, bookId, EPaymentId: paymentMethodId! };
      const invoice = await MTNEPayment.create(createData, { transaction });

      const createInvoiceDate = { ...data, Invoice: invoice.Invoice, Amount: data.Amount * 100 };
      const signature = await digitalSign(JSON.stringify(createInvoiceDate));

      const createInvoce = await axios.post(MTNPaymentAPIS.CREATEINVOICE, createInvoiceDate, {
        headers: {
          Subject: process.env.MTN_SUBJECT,
          'Request-Name': MTNRequestNames.CREATEINVOICE,
          'X-Signature': signature,
          'Accept-Language': language,
        },
      });

      if (createInvoce.data.Errno !== 0) {
        await transaction.rollback();
        throw next(new AppError(createInvoce.data.Error, 400));
      }

      const { Session, Status, Created, Expired, Processed, Commission, Tax, Qr, Currency, Paid } =
        createInvoce.data.Receipt;

      const invoiceFields = { Session, Status, Created, Expired, Processed, Commission, Tax, Qr, Currency, Paid };

      await invoice.update(invoiceFields, { transaction });

      return invoice;
    } catch (error: any) {
      await transaction.rollback();
      throw next(new AppError(error.message, 400));
    }
  };

  public initPayment = async (
    data: InitPaymentDTO,
    bookId: number,
    language: 'ar' | 'en',
    transaction: Transaction,
    next: NextFunction,
  ) => {
    try {
      const parsedData = await initPayment.safeParseAsync(data);
      if (!parsedData.success) {
        await transaction.rollback();
        throw next(parsedData.error);
      }
      const invoice = await this.getInvoice(bookId, transaction, next);
      if (!invoice) {
        await transaction.rollback();
        throw next(new AppError(errorMessage('error.invoiceNotFound'), 400));
      }

      const Guid = generateGuid(invoice.Invoice, false);
      const createData = { Phone: data.Phone, Invoice: invoice.Invoice, Guid };
      const signature = await digitalSign(JSON.stringify(createData));

      const createInitPayment = await axios.post(MTNPaymentAPIS.INITPAYMENT, createData, {
        headers: {
          Subject: process.env.MTN_SUBJECT,
          'Request-Name': MTNRequestNames.INITPAYMENT,
          'X-Signature': signature,
          'Accept-Language': language,
        },
      });

      if (createInitPayment.data.Errno !== 0) {
        await transaction.rollback();
        throw next(new AppError(createInitPayment.data.Error, 400));
      }

      const { OperationNumber } = createInitPayment.data;
      const invoiceFields = { OperationNumber, Guid, Phone: data.Phone, resendCount: 1 };

      await invoice.update(invoiceFields, { transaction });

      return invoice;
    } catch (error: any) {
      await transaction.rollback();
      throw next(new AppError(error.message, 400));
    }
  };

  public initPaymentResend = async (
    data: InitPaymentDTO,
    bookId: number,
    language: 'ar' | 'en',
    transaction: Transaction,
    next: NextFunction,
  ) => {
    try {
      const parsedData = await initPayment.safeParseAsync(data);
      if (!parsedData.success) {
        await transaction.rollback();
        return next(parsedData.error);
      }
      const invoice = await this.getInvoice(bookId, transaction, next);
      if (!invoice) {
        await transaction.rollback();
        return next(new AppError(errorMessage('error.invoiceNotFound'), 400));
      }

      const Guid = generateGuid(invoice.Invoice, true, invoice.resendCount);
      const createData = { Phone: data.Phone, Invoice: invoice.Invoice, Guid };
      const signature = await digitalSign(JSON.stringify(createData));

      const createInitPayment = await axios.post(MTNPaymentAPIS.INITPAYMENT, createData, {
        headers: {
          Subject: process.env.MTN_SUBJECT,
          'Request-Name': MTNRequestNames.INITPAYMENT,
          'X-Signature': signature,
          'Accept-Language': language,
        },
      });

      if (createInitPayment.data.Errno !== 0) {
        await transaction.rollback();
        return next(new AppError(createInitPayment.data.Error, 400));
      }

      const { OperationNumber } = createInitPayment.data;
      const invoiceFields = { OperationNumber, Guid, Phone: data.Phone, resendCount: invoice.resendCount! + 1 };

      await invoice.update(invoiceFields, { transaction });

      return invoice;
    } catch (error: any) {
      await transaction.rollback();
      throw next(new AppError(error.message, 400));
    }
  };

  public confirmPayment = async (
    data: ConfirmPaymentDTO,
    bookId: number,
    language: 'ar' | 'en',
    transaction: Transaction,
    next: NextFunction,
  ) => {
    try {
      const parsedData = await confirmPayment.safeParseAsync(data);
      if (!parsedData.success) {
        await transaction.rollback();
        return next(parsedData.error);
      }
      const invoice = await this.getInvoice(bookId, transaction, next);
      if (!invoice) {
        await transaction.rollback();
        return next(new AppError(errorMessage('error.invoiceNotFound'), 400));
      }

      const code = await hashCode(data.Code!);

      const createData = {
        Phone: invoice.Phone,
        Invoice: invoice.Invoice,
        Guid: invoice.Guid,
        Code: code,
        OperationNumber: Number(invoice.OperationNumber),
      };
      const signature = await digitalSign(JSON.stringify(createData));

      const createConfirmPayment = await axios.post(MTNPaymentAPIS.CONFIRMPAYMENT, createData, {
        headers: {
          Subject: process.env.MTN_SUBJECT,
          'Request-Name': MTNRequestNames.CONFIRMPAYMENT,
          'X-Signature': signature,
          'Accept-Language': language,
        },
      });

      if (createConfirmPayment.data.Errno !== 0) {
        await transaction.rollback();
        return next(new AppError(createConfirmPayment.data.Error, 400));
      }

      const { Transaction } = createConfirmPayment.data;
      const invoiceFields = { Code: code, Transaction, Paid: true };

      await invoice.update(invoiceFields, { transaction });
      await invoice.reload({ transaction });
      return invoice;
    } catch (error: any) {
      await transaction.rollback();
      throw next(new AppError(error.message, 400));
    }
  };

  public initRefund = async (bookId: number, language: 'ar' | 'en', transaction: Transaction, next: NextFunction) => {
    try {
      const invoice = await this.getInvoice(bookId, transaction, next);
      if (!invoice) {
        await transaction.rollback();
        throw next(new AppError(errorMessage('error.invoiceNotFound'), 400));
      }

      const createData = { Invoice: invoice.Invoice };

      const signature = await digitalSign(JSON.stringify(createData));

      const createInitRefund = await axios.post(MTNPaymentAPIS.INITREFUND, createData, {
        headers: {
          Subject: process.env.MTN_SUBJECT,
          'Request-Name': MTNRequestNames.INITREFUND,
          'X-Signature': signature,
          'Accept-Language': language,
        },
      });

      if (createInitRefund.data.Errno !== 0) {
        await transaction.rollback();
        return next(new AppError(createInitRefund.data.Error, 400));
      }

      const { BaseInvoice, RefundInvoice, RefundInvoiceDate, RefundAmount, Commission, TaxSender } =
        createInitRefund.data;

      const params = Object.fromEntries(createInitRefund.data.Parameters.map((p: any) => [p.ParameterName, p.Data]));
      const RecipientFullName = params['RecipientFullName'];
      const RecipientPan = params['RecipientPan'];
      const RecipientPhone = params['RecipientPhone'];

      const initRefundFields = {
        BaseInvoice,
        RefundInvoice,
        RefundInvoiceDate,
        RefundAmount,
        TaxSender,
        RefundComission: Commission,
        RecipientFullName,
        RecipientPan,
        RecipientPhone,
      };

      await invoice.update(initRefundFields, { transaction });
      await invoice.reload({ transaction });
      return invoice;
    } catch (error: any) {
      await transaction.rollback();
      throw next(new AppError(error.message, 400));
    }
  };

  public confirmRefund = async (
    bookId: number,
    language: 'ar' | 'en',
    transaction: Transaction,
    next: NextFunction,
  ) => {
    try {
      const invoice = await this.getInvoice(bookId, transaction, next);
      if (!invoice) {
        await transaction.rollback();
        return next(new AppError(errorMessage('error.invoiceNotFound'), 400));
      }
      const createData = { BaseInvoice: Number(invoice.BaseInvoice), RefundInvoice: Number(invoice.RefundInvoice) };

      const signature = await digitalSign(JSON.stringify(createData));

      const createConfirmRefund = await axios.post(MTNPaymentAPIS.CONFIRMREFUND, createData, {
        headers: {
          Subject: process.env.MTN_SUBJECT,
          'Request-Name': MTNRequestNames.CONFIRMREFUND,
          'X-Signature': signature,
          'Accept-Language': language,
        },
      });

      if (createConfirmRefund.data.Errno !== 0) {
        await transaction.rollback();
        return next(new AppError(createConfirmRefund.data.Error, 400));
      }

      const confirmRefundFields = { isRefunded: true };

      await invoice.update(confirmRefundFields, { transaction });
      await invoice.reload({ transaction });
      return invoice;
    } catch (error: any) {
      await transaction.rollback();
      return next(new AppError(error.message, 400));
    }
  };

  private getInvoice = async (bookId: number, transaction: Transaction, next: NextFunction) => {
    const invoice = await MTNEPayment.findOne({ where: { bookId }, transaction });

    if (!invoice) return next(new AppError(errorMessage('error.invoiceNotFound'), 404));

    const getData = {
      Invoice: invoice.Invoice,
    };
    const signature = await digitalSign(JSON.stringify(getData));

    const getInvoice = await axios.post(MTNPaymentAPIS.GETINVOICE, getData, {
      headers: {
        Subject: process.env.MTN_SUBJECT,
        'Request-Name': MTNRequestNames.GETINVOICE,
        'X-Signature': signature,
        'Accept-Language': 'en',
      },
    });

    if (getInvoice.data.Errno !== 0) {
      await transaction.rollback();
      return next(new AppError(getInvoice.data.Error, 400));
    }

    invoice.Status = getInvoice.data.Status;
    invoice.Paid = getInvoice.data.Paid;

    await invoice.save({ transaction });

    return invoice;
  };
}

import { sequelize } from '../DB/sequelize.js';
export default new MTNEPaymentService(sequelize);
