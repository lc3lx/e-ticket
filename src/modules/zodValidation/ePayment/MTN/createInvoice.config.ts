import { z } from 'zod';
import { Amount, Session, TTL } from './MTN.schema';

export const createInvoice = z
  .object({
    Amount,
    Session,
    TTL,
  })
  .strict();
