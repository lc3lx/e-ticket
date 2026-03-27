import { z } from 'zod';
import {
  firstNameSchema,
  lastNameSchema,
  mobileNumberSchema,
  genderSchema,
  provincesSchema,
  birthDate,
} from './normalUser.schema';
import NormalUser from '../../../models/normalUser.model';
import EventType from '../../../models/eventType.model';
import Province from '../../../models/provinces.model';
import { Op } from 'sequelize';

export const updateUserSchema = z
  .object({
    firstName: firstNameSchema.optional(),
    lastName: lastNameSchema.optional(),
    mobileNumber: mobileNumberSchema.optional(),
    birthDate: birthDate.optional(),
    gender: genderSchema.optional(),
    profilePicture: z.string().optional(),
    provinceIds: provincesSchema.optional(),
    eventTypeIds: z
      .array(z.union([z.number(), z.string()]))
      .transform((arr) => arr.filter((el) => el !== '').map((el) => Number(el)))
      .optional()
      .refine((arr) => arr === undefined || arr.every((id) => !isNaN(id)), {
        message: 'eventTypeIdInvalid',
      }),
  })
  .strict()
  .superRefine(async (data, ctx) => {
    if (data.mobileNumber) {
      const exists = await NormalUser.findOne({ where: { mobileNumber: data.mobileNumber } });
      if (exists) {
        ctx.addIssue({
          path: ['mobileNumber'],
          code: z.ZodIssueCode.custom,
          message: 'mobileNumberExist',
        });
      }
    }

    if (data.provinceIds) {
      const validProvinces = await Province.findAll({ where: { id: { [Op.in]: data.provinceIds } } });
      const invalidProvinceIds = data.provinceIds.filter((id) => !validProvinces.some((p) => p.id === id));

      for (const id of invalidProvinceIds) {
        ctx.addIssue({
          path: ['provinces'],
          code: z.ZodIssueCode.custom,
          message: `invalidProvinceId: ${id}`,
        });
      }
    }

    if (data.eventTypeIds) {
      const validEventTypes = await EventType.findAll({ where: { id: { [Op.in]: data.eventTypeIds } } });
      const invalidEventIds = data.eventTypeIds.filter((id) => !validEventTypes.some((et) => et.id === id));

      for (const id of invalidEventIds) {
        ctx.addIssue({
          path: ['eventTypeId'],
          code: z.ZodIssueCode.custom,
          message: `invalidEventTypeId: ${id}`,
        });
      }
    }
  });
