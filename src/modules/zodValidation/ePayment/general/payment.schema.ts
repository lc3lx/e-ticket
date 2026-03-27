import { z } from 'zod';
import allEPayment from '../../../../models/allEPayment.model';

export const id = z.number().int().positive();
export const ServiceName = z
  .string({ required_error: 'Service name is required' })
  .min(1, 'Service name cannot be empty')
  .toUpperCase();
export const paymentMethodLogo = z.string();
export const color = z.string();
export const isEnabled = z.union([
  z.boolean(),
  z.literal('true').transform(() => true),
  z.literal('false').transform(() => false),
]);
export const mobileNumber = z.string();
export const bankName = z.string();
export const bankAccount = z.string();
export const serviceNameExist = async (data: { ServiceName?: string }, ctx: z.RefinementCtx) => {
  if (!ServiceName) return;
  const exists = await allEPayment.findOne({
    where: { ServiceName: data.ServiceName },
  });
  if (exists) {
    ctx.addIssue({
      path: ['ServiceName'],
      code: z.ZodIssueCode.custom,
      message: 'serviceExist',
    });
  }
};
export const serviceNameExistById = async (data: { id?: number }, ctx: z.RefinementCtx) => {
  if (!id) return;
  const exists = await allEPayment.findOne({
    where: { id: data.id },
  });
  if (exists && exists.id !== data.id) {
    ctx.addIssue({
      path: ['ServiceName'],
      code: z.ZodIssueCode.custom,
      message: 'Service name already exists',
    });
  }
};
