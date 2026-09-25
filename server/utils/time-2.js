import { DateTime } from 'luxon';

export function toUTC(iso, timezone) {
  return DateTime.fromISO(iso, { zone: timezone }).toUTC().toISO();
}

export function fromUTC(iso, timezone) {
  return DateTime.fromISO(iso, { zone: 'utc' }).setZone(timezone);
}

export function formatInTimezone(iso, timezone, format = 'EEE, MMM d, h:mm a') {
  return fromUTC(iso, timezone).toFormat(format);
}

export function currentTimeInTimezone(timezone) {
  return DateTime.now().setZone(timezone);
}

export function startOfDay(timezone, dateStr) {
  return DateTime.fromISO(dateStr, { zone: timezone }).startOf('day');
}

export function toUTCFromDateTime(dateTime) {
  return dateTime.toUTC().toISO();
}

export function generateSlots(startOfDay, endOfDay, serviceDuration, bufferBefore, bufferAfter, stepMinutes = 15) {
  const slots = [];
  let cursor = startOfDay;
  while (cursor.plus({ minutes: serviceDuration + bufferBefore + bufferAfter }) <= endOfDay) {
    const slotStart = cursor.plus({ minutes: bufferBefore });
    slots.push({
      start: slotStart.toISO(),
      end: slotStart.plus({ minutes: serviceDuration }).toISO(),
      startLocal: slotStart.toFormat('HH:mm'),
      endLocal: slotStart.plus({ minutes: serviceDuration }).toFormat('HH:mm'),
    });
    cursor = cursor.plus({ minutes: stepMinutes });
  }
  return slots;
}

export function isWithinBusinessHours(timezone, dateTime, openingHours) {
  const dayKey = dateTime.toFormat('cccc').toLowerCase();
  const hours = openingHours[dayKey];
  if (!hours || hours.length === 0) return false;
  const timeStr = dateTime.toFormat('HH:mm');
  return hours.some(h => timeStr >= h.open && timeStr <= h.close);
}

export function dbDayOfWeek(dateTime) {
  return dateTime.weekday % 7; // Monday=1 -> 1, Sunday=7 -> 0
}
