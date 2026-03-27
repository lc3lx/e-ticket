export const PAYMENT_METHOD_RULES = {
  MTN: {
    codeExpireMinutes: 10,
    resendWaitMinutes: 1,
    maxRetries: 30,
  },
  SYRIATEL: {
    codeExpireMinutes: 7,
    resendWaitMinutes: 1,
    maxRetries: 30,
  },
  // Future providers go here
} as const;

export type PaymentServiceName = keyof typeof PAYMENT_METHOD_RULES; // 'MTN' | 'SYRIATEL'
