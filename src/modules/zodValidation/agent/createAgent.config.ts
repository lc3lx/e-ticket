import { z } from 'zod';
import Agent from '../../../models/agent.model';
import Province from '../../../models/provinces.model';
import { name, mobileNumberSchema, provinceSchema, location, agentPhoto } from './agent.schema';

export const createAgentSchema = z
  .object({
    name,
    mobileNumber: mobileNumberSchema,
    provinceId: provinceSchema,
    location,
    agentPhoto,
  })
  .strict()
  .superRefine(async (data, ctx) => {
    const provinceExist = await Province.findByPk(data.provinceId);
    if (!provinceExist) {
      ctx.addIssue({
        path: ['provinceId'],
        code: z.ZodIssueCode.custom,
        message: 'provincesNotFound',
      });
    }
    const agentExist = await Agent.findOne({ where: { mobileNumber: data.mobileNumber } });
    if (agentExist) {
      ctx.addIssue({
        path: ['mobileNumber'],
        code: z.ZodIssueCode.custom,
        message: 'agentExists',
      });
    }
  });
