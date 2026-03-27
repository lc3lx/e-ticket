import { z } from 'zod';
import {
  firstNameSchema,
  lastNameSchema,
  password,
  passwordConfirm,
  passwordUpdateRefinements,
  // role,
} from './admin.schema';

export const updateAdminSchema = z
  .object({
    firstName: firstNameSchema.optional(),
    lastName: lastNameSchema.optional(),
    // role: role.optional(),
    oldPassword: z.string().min(1, 'passwordFieldEmpty').optional(),
    password: password.optional(),
    passwordConfirm: passwordConfirm.optional(),
  })
  .strict()
  .superRefine(passwordUpdateRefinements);
