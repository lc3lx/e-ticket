export const parseZodHour = (timeStr: string | undefined) => {
  if (!timeStr) return null;
  const match = /^(0?[1-9]|1[0-2]):([0-5][0-9])\s?(AM|PM)$/i.exec(timeStr);
  if (!match) return null;

  let hour = parseInt(match[1]);
  const minute = parseInt(match[2]);
  const period = match[3].toUpperCase();

  if (period === 'PM' && hour !== 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;

  return { hour, minute };
};

/**
 * Combine a DATEONLY value and a string hour (AM/PM) into a JS Date object.
 * @param date DATEONLY string or Date
 * @param time AM/PM string
 * @param fallback optional Date to handle endHour < startHour (next day)
 */
export const combineZodDateAndHour = (date: Date | string | undefined, time: string | undefined, fallback?: Date) => {
  if (!date) return fallback ?? null;
  const timeObj = parseZodHour(time);
  const newDate = new Date(date);

  if (timeObj) {
    newDate.setHours(timeObj.hour, timeObj.minute, 0, 0);

    // if fallback provided and newDate < fallback => endHour < startHour => next day
    if (fallback && newDate < fallback) {
      newDate.setDate(newDate.getDate() + 1);
    }
  }

  return newDate;
};
