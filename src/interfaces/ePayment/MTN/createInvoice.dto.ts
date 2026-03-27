import { z } from 'zod';
import { createInvoice } from '../../../modules/zodValidation/ePayment/MTN/createInvoice.config';

export type CreateMTNInvoiceDTO = z.infer<typeof createInvoice>;

// export type ExtendedCreateInvoiceDTO = CreateInvoiceDTO & {
//   language: 'en' | 'ar';
// };
