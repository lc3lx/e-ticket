import { z } from 'zod';
import { errorMessage } from '../../../../modules/i18next.config';
import { mobileNumberSchema } from '../../globalConfig.schema';

// export const mobileNumberSchema = mobileNumberSchema;

export const bookId = z.number().int().positive();
export const mobileNumber = mobileNumberSchema;
export const ServiceName = z.string().min(1);
export const language = z.enum(['ar', 'en']);
