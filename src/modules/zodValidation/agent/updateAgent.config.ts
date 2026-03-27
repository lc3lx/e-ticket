import { z } from 'zod';
import Agent from '../../../models/agent.model';
import Province from '../../../models/provinces.model';
import { name, mobileNumberSchema, provinceSchema, location, agentPhoto } from './agent.schema';

export const updateAgentSchema = z
  .object({
    name: name.optional(),
    mobileNumber: mobileNumberSchema.optional(),
    agentPhoto: agentPhoto.optional(),
    location: location.optional(),
    provinceId: provinceSchema.optional(),
  })
  .strict()
  .superRefine(async (data, ctx) => {
    if (data.mobileNumber) {
      const exists = await Agent.findOne({ where: { mobileNumber: data.mobileNumber } });
      if (exists) {
        ctx.addIssue({
          path: ['mobileNumber'],
          code: z.ZodIssueCode.custom,
          message: 'agentExists',
        });
      }
    }

    if (data.provinceId) {
      const provinceExist = await Province.findByPk(data.provinceId);
      if (!provinceExist) {
        ctx.addIssue({
          path: ['provinceId'],
          code: z.ZodIssueCode.custom,
          message: 'provincesNotFound',
        });
      }
    }
  });
