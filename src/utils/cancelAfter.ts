function buildEndApplyFullDate(endApplyDate: string | Date, endEventHour: string): Date {
  const { hour, minute } = parseHourToDateParts(endEventHour);

  // Format the date string as ISO
  const datePart = endApplyDate instanceof Date ? endApplyDate.toISOString().split('T')[0] : endApplyDate;

  // Force the string to be interpreted as Damascus (+03:00)
  // Example result: "2026-01-17T07:00:00+03:00"
  const isoString = `${datePart}T${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00+03:00`;

  return new Date(isoString);
}

export function calculateCancelAfter(createdAt: Date, endApplyDate: string | Date, endEventHour: string): Date {
  const endApplyFull = buildEndApplyFullDate(endApplyDate, endEventHour);

  const nowMs = Date.now();
  const createdMs = createdAt.getTime();
  const endApplyMs = endApplyFull.getTime();

  const oneDayMs = 24 * 60 * 60 * 1000;
  const twoHoursMs = 2 * 60 * 60 * 1000;

  let resultMs: number;

  // Condition: Between current time and endApplyFull less than or equal 2 hours
  if (endApplyMs - nowMs <= twoHoursMs) {
    // Set the time to endApplyFull exactly
    resultMs = endApplyMs;
  } else {
    // Standard logic
    resultMs = Math.min(createdMs + oneDayMs, endApplyMs - twoHoursMs);
  }

  return new Date(resultMs);
}

export function calculateCancelAfterInMinutes(cancelAfter: Date): number {
  const diffMs = cancelAfter.getTime() - Date.now();
  return Math.max(0, Math.floor(diffMs / 60000));
}

function parseHourToDateParts(hourString: string): { hour: number; minute: number } {
  const [time, modifier] = hourString.split(' ');
  let [hour, minute] = time.split(':').map(Number);

  if (modifier.toUpperCase() === 'PM' && hour !== 12) hour += 12;
  if (modifier.toUpperCase() === 'AM' && hour === 12) hour = 0;

  return { hour, minute };
}

// function buildEndApplyFullDate(endApplyDate: string | Date, endEventHour: string): Date {
//   const { hour, minute } = parseHourToDateParts(endEventHour);

//   let d: Date;
//   if (endApplyDate instanceof Date) {
//     d = new Date(endApplyDate);
//   } else {
//     // DATEONLY string → convert to date at 00:00
//     d = new Date(`${endApplyDate}T00:00:00`);
//   }

//   d.setHours(hour, minute, 0, 0);
//   return d;
// }
