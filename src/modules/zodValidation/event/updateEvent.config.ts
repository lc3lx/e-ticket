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
} from './event.schema';
import { combineZodDateAndHour } from '../../../utils/zodDateTimeHelper';

export const updateEventSchema = z
  .object({
    eventName: eventName.optional(),
    mainPhoto: mainPhoto.optional(),
    miniPoster: miniPoster.optional(),
    eventPhotos: eventPhotos.optional(),
    eventType: eventType.optional(),
    startEventDate: startEventDate.optional(),
    endEventDate: endEventDate.optional(),
    startApplyDate: startApplyDate.optional(),
    endApplyDate: endApplyDate.optional(),
    startEventHour: startEventHour.optional(),
    endEventHour: endEventHour.optional(),
    province: province.optional(),
    location: location.optional(),
    ticketOptionsAndPrices: ticketOptionsAndPrices.optional(),
    attendanceType: attendanceType.optional(),
    seatsQty: seatsQty.optional(),
    description: description.optional(),
    notes: notes.optional(),
    needApproveFromSupervisor: needApproveFromSupervisor.optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    // Combine startEventDate + startEventHour
    const startEvent = combineZodDateAndHour(data.startEventDate, data.startEventHour);

    // Combine endEventDate + endEventHour relative to startEvent
    const endEvent = combineZodDateAndHour(data.endEventDate, data.endEventHour, startEvent ?? undefined);

    // Combine startApplyDate + startEventHour
    const startApply = combineZodDateAndHour(data.startApplyDate, data.startEventHour);

    // Combine endApplyDate + startEventHour (for validation relative to startEvent)
    const endApply = combineZodDateAndHour(data.endApplyDate, data.startEventHour);

    // 1) Validate apply duration >= 24 hours
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

    // 2) Validate event duration (endEvent must be after startEvent)
    if (startEvent && endEvent && endEvent < startEvent) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'validateEventEndDate',
        path: ['endEventDate'],
      });
    }

    // 3) Validate endApply < startEvent - 24h
    if (startEvent && endApply && endApply >= new Date(startEvent.getTime() - 24 * 60 * 60 * 1000)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'eventApplyAndStartDuration',
        path: ['endApplyDate'],
      });
    }
  })
  .superRefine(async (data, ctx) => {
    // Province existence check
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

    // EventType existence check
    if (data.eventType) {
      const eventTypesExist = await EventType.findAll({ where: { id: data.eventType } });
      if (!eventTypesExist) {
        ctx.addIssue({
          path: ['eventType'],
          code: z.ZodIssueCode.custom,
          message: 'eventTypeNotFound',
        });
      }
    }
  });
