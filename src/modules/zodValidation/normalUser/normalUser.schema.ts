import { z } from 'zod';
import { nameRegex } from '../../../utils/regexs';
import { validateAge } from '../../../utils/validAge';
import { errorMessage } from '../../../modules/i18next.config';

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

export const mobileNumberSchema = z
  .string({ required_error: 'phoneNumberEmpty' })
  .regex(/^\d+$/, 'mobileMustBeNumeric')
  .refine((val) => val.startsWith('963'), 'phoneNumberCountryCode')
  .refine((val) => val.length === 12, 'phoneNumberLength')
  .refine((val) => val !== '', 'phoneNumberEmpty');

export const genderSchema = z.enum(['male', 'female'], {
  errorMap: () => ({ message: 'maleOrFemaleOnly' }),
});

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

export const provincesSchema = z.array(z.coerce.number()).min(1, 'normalUserProvinces');
export const eventTypesSchema = z.array(z.coerce.number()).min(1, 'normalUserEventsTypes');
