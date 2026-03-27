import { z } from 'zod';
import { initPayment } from '../../../modules/zodValidation/ePayment/globalPayment/initPayment.config';

export type InitPaymentDTO = z.infer<typeof initPayment>;
