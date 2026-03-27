import { z } from 'zod';
import { Op } from 'sequelize';
import NormalUser from '../../../models/normalUser.model';
import EventType from '../../../models/eventType.model';
import Province from '../../../models/provinces.model';
import {
  firstNameSchema,
  lastNameSchema,
  mobileNumberSchema,
  genderSchema,
  provincesSchema,
  eventTypesSchema,
  birthDate,
} from './normalUser.schema';

export const registerUserSchema = z
  .object({
    firstName: firstNameSchema,
    lastName: lastNameSchema,
    mobileNumber: mobileNumberSchema,
    gender: genderSchema,
    provinces: provincesSchema,
    eventTypeId: eventTypesSchema,
    birthDate,
  })
  .strict()
  .superRefine(async (data, ctx) => {
    const exists = await NormalUser.findOne({ where: { mobileNumber: data.mobileNumber } });
    if (exists) {
      ctx.addIssue({
        path: ['mobileNumber'],
        code: z.ZodIssueCode.custom,
        message: 'phoneNumberExist',
      });
    }

    const [validEventTypes, validProvinces] = await Promise.all([
      EventType.findAll({ where: { id: { [Op.in]: data.eventTypeId } } }),
      Province.findAll({ where: { id: { [Op.in]: data.provinces } } }),
    ]);

    const invalidEventIds = data.eventTypeId.filter((id) => !validEventTypes.some((et) => et.id === id));
    const invalidProvinceIds = data.provinces.filter((id) => !validProvinces.some((p) => p.id === id));

    for (const id of invalidEventIds) {
      ctx.addIssue({
        path: ['eventTypeId'],
        code: z.ZodIssueCode.custom,
        message: `Invalid EventTypeId: ${id}`,
      });
    }
    for (const id of invalidProvinceIds) {
      ctx.addIssue({
        path: ['provinces'],
        code: z.ZodIssueCode.custom,
        message: `Invalid ProvinceId: ${id}`,
      });
    }
  });
