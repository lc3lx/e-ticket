import { z } from 'zod';
import PaymentMethods from '../../../../common/enums/paymentMethods.enum';

export const Invoice = z.number().int().nonnegative();
export const GatewayType = z
  .enum(Object.values(PaymentMethods) as [string, ...string[]], {
    errorMap: () => ({ message: 'Incorrect Payment Method' }),
  })
  .describe('Payment gateway');
export const Session = z.number().int().nonnegative().optional();
export const TTL = z
  .number()
  .int()
  .min(1)
  .max(60 * 24);
export const Amount = z.number().int().nonnegative();
export const Phone = z
  .string({ required_error: 'phoneNumberEmpty' })
  .regex(/^\d+$/, 'mobileMustBeNumeric')
  .refine((val) => val.startsWith('963'), 'phoneNumberCountryCode')
  .refine((val) => val.length === 12, 'phoneNumberLength')
  .refine((val) => val !== '', 'phoneNumberEmpty')
  .optional();
export const Guid = z.string().uuid().optional();
export const OperationNumber = z.number().int().nonnegative().optional();
export const Created = z.number().int().nonnegative();
export const Expired = z.number().int().nonnegative();
export const Processed = z.number().int();
export const Commission = z.number().int().nonnegative();
export const Tax = z.number().int().nonnegative();
export const Qr = z.string().min(10);
export const Currency = z.number().int().nonnegative();
export const Paid = z.boolean();
export const Status = z.enum(['0', '1', '5', '8', '9']).transform(Number);
export const Code = z
  .string()
  .length(6, 'paymentOTPCodeLength')
  .regex(/^\d{6}$/, 'paymentOTPCodeLength')
  .optional();

export const Transaction = z.string().optional();
