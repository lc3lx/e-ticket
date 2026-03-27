import { z } from 'zod';
import { Supervisor } from '../../../models/supervisor.model';
import Province from '../../../models/provinces.model';
import EventType from '../../../models/eventType.model';
import {
  firstName,
  lastName,
  mobileNumber,
  birthDate,
  gender,
  password,
  passwordConfirm,
  province,
  location,
  workInfo,
  workDocument,
  workType,
} from './supervisor.schema';
import { Op } from 'sequelize';

export const registerSupervisorSchema = z
  .object({
    firstName,
    lastName,
    mobileNumber,
    birthDate,
    gender,
    password,
    passwordConfirm,
    province,
    location,
    workInfo,
    workDocument,
    workType,
  })
  .strict()
  .refine((data) => data.password === data.passwordConfirm, {
    message: 'PasswordsNotMatched',
    path: ['passwordConfirm'],
  })
  .superRefine(async (data, ctx) => {
    const mobileNumberExists = await Supervisor.findOne({ where: { mobileNumber: data.mobileNumber } });
    if (mobileNumberExists) {
      ctx.addIssue({
        path: ['mobileNumber'],
        code: z.ZodIssueCode.custom,
        message: 'phoneNumberExist',
      });
    }

    const provinceExist = await Province.findByPk(data.province);
    if (!provinceExist) {
      ctx.addIssue({
        path: ['province'],
        code: z.ZodIssueCode.custom,
        message: 'provincesNotFound',
      });
    }

    const eventTypesExist = await EventType.findAll({ where: { id: { [Op.in]: data.workType } } });
    const invalidEventTypeIds = data.workType.filter((id) => !eventTypesExist.some((et) => et.id === id));
    if (invalidEventTypeIds.length > 0) {
      ctx.addIssue({
        path: ['workType'],
        code: z.ZodIssueCode.custom,
        message: `Invalid eventTypeId(s): ${invalidEventTypeIds.join(', ')}`,
      });
    }
  });
