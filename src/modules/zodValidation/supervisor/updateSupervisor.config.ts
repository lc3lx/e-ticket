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
  province,
  location,
  workInfo,
  workDocument,
  workType,
} from './supervisor.schema';
import { Op } from 'sequelize';

export const updateSupervisorSchema = z
  .object({
    firstName: firstName.optional(),
    lastName: lastName.optional(),
    mobileNumber: mobileNumber.optional(),
    birthDate: birthDate.optional(),
    gender: gender.optional(),
    province: province.optional(),
    location: location.optional(),
    workInfo: workInfo.optional(),
    workDocument: workDocument.optional(),
    workType: workType.optional(),
  })
  .strict()
  .superRefine(async (data, ctx) => {
    if (data.mobileNumber) {
      const mobileNumberExists = await Supervisor.findOne({ where: { mobileNumber: data.mobileNumber } });
      if (mobileNumberExists) {
        ctx.addIssue({
          path: ['mobileNumber'],
          code: z.ZodIssueCode.custom,
          message: 'phoneNumberExist',
        });
      }
    }
    if (data.province) {
      const provinceExist = await Province.findByPk(data.province);
      if (!provinceExist) {
        ctx.addIssue({
          path: ['province'],
          code: z.ZodIssueCode.custom,
          message: 'provincesNotFound',
        });
      }
    }
    if (data.workType) {
      const eventTypesExist = await EventType.findAll({ where: { id: { [Op.in]: data.workType } } });
      const invalidEventTypeIds = data.workType.filter((id) => !eventTypesExist.some((et) => et.id === id));
      if (invalidEventTypeIds.length > 0) {
        ctx.addIssue({
          path: ['workType'],
          code: z.ZodIssueCode.custom,
          message: `Invalid eventTypeId(s): ${invalidEventTypeIds.join(', ')}`,
        });
      }
    }
  });
