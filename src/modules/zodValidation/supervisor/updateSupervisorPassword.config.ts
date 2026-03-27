import { z } from 'zod';
import { password, passwordConfirm, passwordUpdateRefinements } from './supervisor.schema';
import { passwordRegex } from '../../../utils/regexs';
import { Supervisor } from '../../../models/supervisor.model';
import ScannerUser from '../../../models/scannerUser.model';

export const updatePassword = (supervisor?: Supervisor | null, scanner?: ScannerUser | null) =>
  z
    .object({
      password,
      passwordConfirm,
      oldPassword: z
        .string({ required_error: 'supervisorPasswordEmpty' })
        .min(10, 'passwordLengthError')
        .max(25, 'passwordLengthError')
        .regex(passwordRegex, 'verifyPassword'),
    })
    .refine((data) => data.password === data.passwordConfirm, {
      message: 'PasswordsNotMatched',
      path: ['passwordConfirm'],
    })
    .superRefine(passwordUpdateRefinements)
    .superRefine(async (data, ctx) => {
      if (supervisor) {
        const valid = await supervisor.correctPassword(data.oldPassword);
        if (!valid) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'incorrectOldPassword',
            path: ['oldPassword'],
          });
        }
      }

      if (scanner) {
        const valid = await scanner.correctPassword(data.oldPassword);
        if (!valid) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'incorrectOldPassword',
            path: ['oldPassword'],
          });
        }
      }
    });
