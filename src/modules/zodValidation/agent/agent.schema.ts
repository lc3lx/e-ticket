import { z } from 'zod';
import { nameRegex } from '../../../utils/regexs';

export const name = z
  .string({ required_error: 'agentNameRequired' })
  .trim()
  .min(2, 'agentNameMinLength')
  .max(20, 'agentNameMaxLength')
  .regex(nameRegex, 'agentNameRegex');

export const agentPhoto = z.string().optional();

export const location = z.string({ required_error: 'agentLocationRequired' }).trim().min(1, 'agentLocationRequired');

export const mobileNumberSchema = z
  .string({ required_error: 'agentMobileNumberRequired' })
  .regex(/^\d+$/, 'mobileMustBeNumeric')
  .refine((val) => val.startsWith('963'), 'phoneNumberCountryCode')
  .refine((val) => val.length === 12, 'phoneNumberLength')
  .refine((val) => val !== '', 'agentMobileNumberRequired');

export const provinceSchema = z.coerce.number({ required_error: 'agentProvinceRequired' });
