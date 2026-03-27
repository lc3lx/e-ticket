import { z } from 'zod';

export const mobileNumberSchema = z
  .string({ required_error: 'phoneNumberEmpty' })
  .regex(/^\d+$/, 'mobileMustBeNumeric')
  .refine((val) => val.startsWith('963'), { message: 'phoneNumberCountryCode' })
  .refine((val) => val.length === 12, { message: 'phoneNumberLength' });

export const zLocalDate = (fieldError: string) =>
  z
    .string({
      required_error: fieldError,
      invalid_type_error: 'invalidDate',
    })
    .refine((v) => /^\d{4}-\d{2}-\d{2}$/.test(v), {
      message: 'invalidDate',
    })
    .transform((v) => new Date(v + 'T00:00:00').toISOString());

export function normalizeToYMD(value: any): string | undefined {
  if (value === undefined || value === null) return undefined;

  if (typeof value === 'string') {
    value = value
      .trim()
      .replace(/^"+|"+$/g, '')
      .replace(/^'+|'+$/g, '');
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const isoMatch = /^\d{4}-\d{2}-\d{2}/.exec(value);
    if (isoMatch) return isoMatch[0];
    const d = new Date(value);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    return undefined;
  }

  if (value instanceof Date) {
    if (isNaN(value.getTime())) return undefined;
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === 'number') {
    const d = new Date(value);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    return undefined;
  }

  // Unknown type
  return undefined;
}
