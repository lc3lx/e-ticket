export function parseHour(hourString: string): { hours24: number; minutes: number } {
  const match = /^(0?[1-9]|1[0-2]):([0-5][0-9])\s?(AM|PM)$/i.exec(hourString.trim());
  if (!match) throw new Error(`Invalid hour format: ${hourString}`);

  let hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  const period = match[3].toUpperCase();

  if (period === 'PM' && hour !== 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;

  return { hours24: hour, minutes: minute };
}

export function combineDateAndHour(dateOnly: Date, hourString: string, referenceDate?: Date): Date {
  const { hours24, minutes } = parseHour(hourString);
  const combined = new Date(dateOnly);

  combined.setHours(hours24, minutes, 0, 0);

  if (referenceDate && combined < referenceDate) {
    combined.setDate(combined.getDate() + 1);
  }

  return combined;
}

export function compareDateAndHour(dateA: Date, hourA: string, dateB: Date, hourB: string): number {
  const dtA = combineDateAndHour(dateA, hourA);
  const dtB = combineDateAndHour(dateB, hourB);

  if (dtA < dtB) return -1;
  if (dtA > dtB) return 1;
  return 0;
}
