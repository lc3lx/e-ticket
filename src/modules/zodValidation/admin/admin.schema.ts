import { z } from 'zod';
import AdminTypes from '../../../common/enums/adminTypes.enum.js';
import { nameRegex, passwordRegex } from '../../../utils/regexs.js';

const domain = process.env.DOMAIN_NAME || 'e-ticket.sy';

export const emailRegex = new RegExp(`^[\\w-.]+@${domain.replace('.', '\\.')}$`);

export const firstNameSchema = z
  .string({ required_error: 'firstNameEmpty' })
  .trim()
  .min(2, 'firstNameLength')
  .max(20, 'firstNameLength')
  .regex(nameRegex, 'firstNameValidation');

export const lastNameSchema = z
  .string({ required_error: 'lastNameEmpty' })
  .trim()
  .min(2, 'lastNameLength')
  .max(20, 'lastNameLength')
  .regex(nameRegex, 'lastNameValidation');

export const email = z.string({ required_error: 'emailFieldEmpty' }).trim().regex(emailRegex, 'NotValidEmail');

export const password = z
  .string({ required_error: 'passwordFieldEmpty' })
  .min(10, 'passwordLengthError')
  .max(25, 'passwordLengthError')
  .regex(passwordRegex, 'verifyPassword');

export const passwordConfirm = z.string({ required_error: 'passwordConfirmFieldEmpty' });

export const role = z.enum(Object.values(AdminTypes) as [string, ...string[]], {
  errorMap: () => ({ message: 'incorrect role' }),
});

export const passwordUpdateRefinements = (
  data: {
    oldPassword?: string;
    password?: string;
    passwordConfirm?: string;
  },
  ctx: z.RefinementCtx,
) => {
  const { oldPassword, password, passwordConfirm } = data;
  const partialFields = [!!oldPassword, !!password, !!passwordConfirm].filter(Boolean).length;

  if (partialFields > 0 && partialFields < 3) {
    if (!oldPassword) ctx.addIssue({ code: 'custom', message: 'oldPasswordFieldEmpty', path: ['oldPassword'] });
    if (!password) ctx.addIssue({ code: 'custom', message: 'passwordFieldEmpty', path: ['password'] });
    if (!passwordConfirm)
      ctx.addIssue({ code: 'custom', message: 'passwordConfirmFieldEmpty', path: ['passwordConfirm'] });
    return;
  }
  if (password && passwordConfirm && password !== passwordConfirm) {
    ctx.addIssue({ code: 'custom', message: 'passwordsNotMatch', path: ['passwordConfirm'] });
  }
};
