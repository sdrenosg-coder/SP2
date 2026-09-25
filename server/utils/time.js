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

export function dbDayOfWeek(dateTime) {
  return dateTime.weekday % 7; // Monday=1 -> 1, Sunday=7 -> 0
}
