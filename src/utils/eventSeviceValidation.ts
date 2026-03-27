import { errorMessage } from '../modules/i18next.config';
import AppError from './AppError';

export function validateRelativeEventDates(
  startDate: Date | undefined,
  endDate: Date | undefined,
  startHour?: string,
  endHour?: string,
  startApply?: Date | undefined,
  endApply?: Date | undefined,
) {
  const combine = (date: Date | undefined, hour?: string, fallback?: Date) => {
    if (!date) return fallback ?? null;
    const result = new Date(date);
    if (hour) {
      const match = /^(0?[1-9]|1[0-2]):([0-5][0-9])\s?(AM|PM)$/i.exec(hour);
      if (match) {
        let h = parseInt(match[1]);
        const m = parseInt(match[2]);
        const p = match[3].toUpperCase();
        if (p === 'PM' && h !== 12) h += 12;
        if (p === 'AM' && h === 12) h = 0;
        result.setHours(h, m, 0, 0);
      }
    }
    return result;
  };

  const adjustedStart = combine(startDate, startHour);
  const adjustedEnd = combine(endDate, endHour, adjustedStart ?? undefined);

  // 1️⃣ Validate event start/end relative order

  if (adjustedStart && adjustedEnd && endHour && startHour) {
    const [startH, startM] = parseHour(startHour);
    const [endH, endM] = parseHour(endHour);

    if (endH * 60 + endM <= startH * 60 + startM) {
      // Event ends next day
      adjustedEnd.setDate(adjustedEnd.getDate() + 1);
    }
  }

  if (adjustedStart && adjustedEnd && adjustedEnd < adjustedStart) {
    throw new AppError(errorMessage('error.validateEventEndDate'), 400);
  }

  // 2️⃣ Validate apply dates relative order

  if (startApply && endApply && endApply < startApply) {
    throw new AppError(errorMessage('error.eventApplyDatesInvalid'), 400);
  }

  // 3️⃣ Validate that apply period is not already ended
  const now = new Date();
  const endApplyDate = endApply instanceof Date ? endApply : new Date(endApply!);
  if (endApply && endApplyDate.getTime() < now.getTime()) {
    throw new AppError(errorMessage('UpdateEventAfterEndReservation'), 400);
  }
}

function parseHour(hourStr: string) {
  const match = /^(0?[1-9]|1[0-2]):([0-5][0-9])\s?(AM|PM)$/i.exec(hourStr);
  if (!match) return [0, 0];
  let h = parseInt(match[1]);
  const m = parseInt(match[2]);
  const p = match[3].toUpperCase();
  if (p === 'PM' && h !== 12) h += 12;
  if (p === 'AM' && h === 12) h = 0;
  return [h, m];
}
