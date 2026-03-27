import { z } from 'zod';
import { Op } from 'sequelize';
import { mobileNumber, bookId, ServiceName, language } from './payment.schema';
import EPayment from '../../../../models/allEPayment.model';

export const initPayment = z
  .object({
    mobileNumber,
    bookId,
    ServiceName,
    language,
  })
  .strict()
  .superRefine(async (data, ctx) => {
    const exists = await EPayment.findOne({ where: { ServiceName: data.ServiceName } });
    if (!exists) {
      ctx.addIssue({
        path: ['ServiceName'],
        code: z.ZodIssueCode.custom,
        message: 'Service Not Found',
      });
    }
  });
