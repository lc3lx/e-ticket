import { z } from 'zod';
import { firstNameSchema, lastNameSchema, email, password, passwordConfirm, role } from './admin.schema';
import DashboardAdmin from '../../../models/dashboardAdmin.model';

export const registerAdminSchema = z
  .object({
    firstName: firstNameSchema,
    lastName: lastNameSchema,
    email,
    password,
    passwordConfirm,
    role,
  })
  .strict()
  .refine((data) => data.password === data.passwordConfirm, {
    message: 'PasswordsNotMatched',
    path: ['passwordConfirm'],
  })
  .superRefine(async (data, ctx) => {
    const emailExist = await DashboardAdmin.findOne({ where: { email: data.email } });
    if (emailExist) {
      ctx.addIssue({
        path: ['email'],
        code: z.ZodIssueCode.custom,
        message: 'emailExist',
      });
    }
  });
