import { z } from 'zod';
import { initPayment } from '../../../modules/zodValidation/ePayment/MTN/initPayment.config';

export type InitPaymentDTO = z.infer<typeof initPayment>;
