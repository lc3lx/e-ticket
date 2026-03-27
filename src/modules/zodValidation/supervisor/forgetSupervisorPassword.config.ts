import { z } from 'zod';
import { password, passwordConfirm, mobileNumber, passwordForgetRefinements } from './supervisor.schema';

export const forgetPassword = z
  .object({
    mobileNumber,
    password,
    passwordConfirm,
  })
  .strict()
  .refine((data) => data.password === data.passwordConfirm, {
    message: 'PasswordsNotMatched',
    path: ['passwordConfirm'],
  })
  .superRefine(passwordForgetRefinements);
