import { z } from 'zod';
import {
  ServiceName,
  paymentMethodLogo,
  color,
  isEnabled,
  serviceNameExistById,
  mobileNumber,
  bankName,
  bankAccount,
} from './payment.schema';

export const updatePaymentMethod = z
  .object({
    id: z.number().int().positive(),
    ServiceName: ServiceName.optional(),
    paymentMethodLogo: paymentMethodLogo.optional(),
    isEnabled: isEnabled.optional(),
    color: color.optional(),
    mobileNumber: mobileNumber.optional(),
    bankName: bankName.optional(),
    bankAccount: bankAccount.optional(),
  })
  .strict()
  .superRefine(serviceNameExistById);
