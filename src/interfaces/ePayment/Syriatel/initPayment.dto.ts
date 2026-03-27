// import { z } from 'zod';
// import { initPayment } from '../../../modules/zodValidation/ePayment/MTN/initPayment.config';

export class SyriatelInitPaymentDTO {
  amount!: string;
  customerMSISDN!: string;
  bookId!: number;
  paymentMethodId!: number;
}
