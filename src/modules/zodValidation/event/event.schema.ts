import { z } from 'zod';
import AttendanceType from '../../../common/enums/AttendanceType.enum';
import { eventNameRegex } from '../../../utils/regexs';
import TicketType from '../../../common/enums/ticketTypes.enum.js';
import { zLocalDate } from '../globalConfig.schema';

const timePattern = /^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/i;

export const eventName = z
  .string({ required_error: 'eventNameEmptyError' })
  .trim()
  .min(1, 'eventNameEmptyError')
  .min(2, 'eventNameLengthError')
  .max(50, 'eventNameLengthError')
  .regex(eventNameRegex, 'eventNameError');

export const mainPhoto = z.string({ required_error: 'eventMainPhotoMissing' }).min(1, 'eventMainPhotoMissing');

export const miniPoster = z.string({ required_error: 'eventMainPhotoMissing' }).min(1, 'eventMainPhotoMissing');

export const eventPhotos = z.array(z.string()).optional();

export const eventType = z.coerce.number({
  required_error: 'eventTypeRequired',
  invalid_type_error: 'eventTypeRequired',
});

export const startEventDate = zLocalDate('eventStartDate').superRefine((val, ctx) => {
  const today = new Date();
  const dayAfterTomorrow = new Date(today.setDate(today.getDate() + 2));
  dayAfterTomorrow.setHours(3, 0, 0, 0);
  const applyDate = new Date(val);
  //TODO: Need To FIx

  // if (applyDate < dayAfterTomorrow) {
  //   ctx.addIssue({
  //     code: z.ZodIssueCode.custom,
  //     message: 'validateEventStartDate',
  //     // message: 'validateApplyToEventStartDate',
  //   });
  // }
});

export const endEventDate = zLocalDate('eventEndDate');

export const startApplyDate = zLocalDate('applyToEventStartDate').superRefine((val, ctx) => {
  const today = new Date();
  today.setSeconds(0, 0);
  today.setHours(3, 0, 0, 0);

  //TODO:Needed Part// UnComment on production

  // if (new Date(val) < today) {
  //   ctx.addIssue({
  //     code: z.ZodIssueCode.custom,
  //     message: 'validateApplyToEventStartDate',
  //   });
  // }
});

export const endApplyDate = zLocalDate('applyToEventEndDate');

export const startEventHour = z
  .string({ required_error: 'startEventHourEmpty' })
  .regex(timePattern, 'invalidTimeFormat');

export const endEventHour = z.string({ required_error: 'endEventHourEmpty' }).regex(timePattern, 'invalidTimeFormat');

export const province = z.coerce.number({ required_error: 'eventProvince' });

export const location = z.string({ required_error: 'eventLocation' });

const ticketOptionSchema = z.object({
  price: z.number().positive('priceNotZero'),
  description: z.coerce.string().min(0).nullable().optional(),
});

export const ticketOptionsAndPrices = z.record(ticketOptionSchema).superRefine((val, ctx) => {
  if (Object.keys(val).length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'ticketOptionsRequired',
    });
    return; // stop early
  }
  const allowedTypes = Object.values(TicketType);
  Object.keys(val).forEach((key) => {
    if (!allowedTypes.includes(key as TicketType)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Invalid ticket type: ${key}`,
        path: [key],
      });
    }
  });
});

export const attendanceType = z.enum(Object.values(AttendanceType) as [string, ...string[]], {
  errorMap: () => ({ message: 'Invalid attendance type' }),
});

export const seatsQty = z.coerce
  .number({ required_error: 'eventSeatsValidation' })
  .int()
  .min(1, 'eventSeatsValidation');

export const description = z
  .string({ required_error: 'eventDescriptionValidation' })
  .min(1, 'eventDescriptionValidation')
  .max(500, 'eventDescriptionLengthValidation');

export const notes = z.string().optional();

export const profit = z.coerce.number();

// export const eventStatus = z.enum(Object.values(EventStatus) as [string, ...string[]], {
//   errorMap: () => ({ message: 'Invalid event status' }),
// });

export const needApproveFromSupervisor = z.coerce.boolean({
  required_error: 'Approval requirement is needed',
});
