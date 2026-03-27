import { z } from 'zod';
import {
  ServiceName,
  paymentMethodLogo,
  color,
  isEnabled,
  serviceNameExist,
  mobileNumber,
  bankAccount,
  bankName,
} from './payment.schema';

export const createPaymentMethod = z
  .object({
    ServiceName,
    paymentMethodLogo,
    isEnabled,
    color,
    mobileNumber,
    bankAccount,
    bankName,
  })
  .strict()
  .superRefine(serviceNameExist);
