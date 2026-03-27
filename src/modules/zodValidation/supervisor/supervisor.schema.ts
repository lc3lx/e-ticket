import { z } from 'zod';
import { nameRegex, passwordRegex } from '../../../utils/regexs';
import { validateAge } from '../../../utils/validAge';
import { errorMessage } from '../../../modules/i18next.config';

export const firstName = z
  .string({ required_error: 'firstNameEmpty' })
  .trim()
  .min(2, 'firstNameLength')
  .max(20, 'firstNameLength')
  .regex(nameRegex, 'firstNameValidation');

export const lastName = z
  .string({ required_error: 'lastNameEmpty' })
  .trim()
  .min(2, 'lastNameLength')
  .max(20, 'lastNameLength')
  .regex(nameRegex, 'lastNameValidation');

export const mobileNumber = z
  .string({ required_error: 'phoneNumberEmptyModel' })
  .regex(/^\d+$/, 'mobileMustBeNumeric')
  .refine((val) => val.startsWith('963'), 'phoneNumberCountryCode')
  .refine((val) => val.length === 12, 'phoneNumberLength')
  .refine((val) => val !== '', 'phoneNumberEmpty');

export const birthDate = z.coerce
  .date({ required_error: 'birthDateEmty', invalid_type_error: 'invalidDate' })
  .superRefine((val, ctx) => {
    const { valid, error } = validateAge(val, 18, 85);

    if (!valid && error) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: errorMessage(`${error}`),
        params: { minAge: 18, maxAge: 85 },
      });
    }
  });

export const gender = z.enum(['male', 'female'], {
  errorMap: () => ({ message: 'maleOrFemaleOnly' }),
});

export const userName = z.string({ required_error: 'usernameEmpty' }).trim();

export const password = z
  .string({ required_error: 'supervisorPasswordEmpty' })
  .min(10, 'passwordLengthError')
  .max(25, 'passwordLengthError')
  .regex(passwordRegex, 'verifyPassword');

export const passwordConfirm = z.string({ required_error: 'passwordConfirmFieldEmpty' });

export const province = z.coerce.number({ required_error: 'supervisorProvinceEmpty' });

export const location = z.string({ required_error: 'supervisorLocationEmpty' }).trim();

export const workInfo = z.string({ required_error: 'supervisorWorkInfoEmpty' }).trim();

export const workDocument = z.string({ required_error: 'workDocument' }).trim();

export const workType = z.array(z.coerce.number()).min(1, 'supervisorWorkType');

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

export const passwordForgetRefinements = (
  data: {
    // oldPassword?: string;
    password?: string;
    passwordConfirm?: string;
  },
  ctx: z.RefinementCtx,
) => {
  const { password, passwordConfirm } = data;
  const partialFields = [!!password, !!passwordConfirm].filter(Boolean).length;

  if (partialFields > 0 && partialFields < 2) {
    // if (!oldPassword) ctx.addIssue({ code: 'custom', message: 'oldPasswordFieldEmpty', path: ['oldPassword'] });
    if (!password) ctx.addIssue({ code: 'custom', message: 'passwordFieldEmpty', path: ['password'] });
    if (!passwordConfirm)
      ctx.addIssue({ code: 'custom', message: 'passwordConfirmFieldEmpty', path: ['passwordConfirm'] });
    return;
  }
  if (password && passwordConfirm && password !== passwordConfirm) {
    ctx.addIssue({ code: 'custom', message: 'passwordsNotMatch', path: ['passwordConfirm'] });
  }
};
