import { z } from 'zod';
import EventType from '../../../models/eventType.model';
import Province from '../../../models/provinces.model';
import {
  eventName,
  mainPhoto,
  miniPoster,
  eventPhotos,
  eventType,
  startApplyDate,
  endApplyDate,
  startEventDate,
  endEventDate,
  startEventHour,
  endEventHour,
  province,
  location,
  ticketOptionsAndPrices,
  attendanceType,
  seatsQty,
  description,
  notes,
  needApproveFromSupervisor,
  profit,
} from './event.schema';
import { combineZodDateAndHour } from '../../../utils/zodDateTimeHelper';

export const createEventSchema = z
  .object({
    eventName,
    mainPhoto,
    miniPoster,
    eventPhotos: eventPhotos.optional(),
    eventType,
    startEventDate,
    endEventDate,
    startApplyDate,
    endApplyDate,
    startEventHour,
    endEventHour,
    province,
    location,
    ticketOptionsAndPrices,
    attendanceType,
    seatsQty,
    description,
    notes: notes.optional(),
    needApproveFromSupervisor,
    profit: profit.optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    // -----------------------------
    // 1. Parse and combine date+hour
    // -----------------------------
    const startEvent = combineZodDateAndHour(data.startEventDate, data.startEventHour);
    const endEvent = combineZodDateAndHour(data.endEventDate, data.endEventHour, startEvent ?? undefined);
    const startApply = combineZodDateAndHour(data.startApplyDate, data.startEventHour);
    const endApply = combineZodDateAndHour(data.endApplyDate, data.startEventHour);

    // -----------------------------
    // 2. Apply duration >= 24h
    // -----------------------------
    if (startApply && endApply) {
      const applyDuration = endApply.getTime() - startApply.getTime();
      if (applyDuration < 24 * 60 * 60 * 1000) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'eventApplyDuration',
          path: ['endApplyDate'],
        });
      }
    }

    // -----------------------------
    // 3. Event end after event start
    // -----------------------------
    if (startEvent && endEvent && endEvent < startEvent) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'validateEventEndDate',
        path: ['endEventDate'],
      });
    }

    // -----------------------------
    // 4. Apply period must end before event start
    // -----------------------------
    if (endApply && startEvent && endApply >= startEvent) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'eventApplyAndStartDuration',
        path: ['endApplyDate'],
      });
    }
  })
  .superRefine(async (data, ctx) => {
    // -----------------------------
    // 5. DB existence checks
    // -----------------------------
    const provinceExist = await Province.findByPk(data.province);
    if (!provinceExist) {
      ctx.addIssue({
        path: ['province'],
        code: z.ZodIssueCode.custom,
        message: 'provincesNotFound',
      });
    }

    const eventTypesExist = await EventType.findAll({ where: { id: data.eventType } });
    if (!eventTypesExist) {
      ctx.addIssue({
        path: ['eventType'],
        code: z.ZodIssueCode.custom,
        message: 'eventTypeNotFound',
      });
    }
  });
