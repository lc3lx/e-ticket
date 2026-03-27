import { z } from 'zod';
import { Code } from './MTN.schema';

export const confirmPayment = z
  .object({
    Code,
  })
  .strict();
