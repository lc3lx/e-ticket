import { z } from 'zod';
import { Phone, Guid } from './MTN.schema';

export const initPayment = z
  .object({
    Phone,
    // Guid,
  })
  .strict();
