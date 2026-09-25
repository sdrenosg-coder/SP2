import { db } from '../db/index.js';
import { staff, staffShifts, staffTimeOff, staffServices, services, appointmentItems, locations, pricingRules } from '../db/schema.js';
import { eq, and, gte, lte, inArray } from 'drizzle-orm';
import { DateTime } from 'luxon';
import { dbDayOfWeek } from '../utils/time.js';

export async function getAvailableSlots({ businessId, serviceId, locationId, date, staffId = null, durationMinutes = null, timezone = 'UTC', stepMinutes = 15 }) {
  const service = await db.select().from(services).where(eq(services.id, serviceId)).limit(1);
  if (!service.length) throw new Error('Service not found');
  const srv = service[0];
  const effectiveDuration = durationMinutes || srv.durationMinutes;
  const bufferBefore = srv.bufferBefore || 0;
  const bufferAfter = srv.bufferAfter || 0;
  const totalBlock = effectiveDuration + bufferBefore + bufferAfter;

  const dateTime = DateTime.fromISO(date, { zone: timezone }).startOf('day');
  const nextDay = dateTime.plus({ days: 1 }).startOf('day');

  let openingHours = {};
  if (locationId) {
    const loc = await db.select().from(locations).where(eq(locations.id, locationId)).limit(1);
    if (loc.length && loc[0].openingHours) openingHours = loc[0].openingHours;
  }
  if (Object.keys(openingHours).length === 0) {
    openingHours = {
      monday: [{open:'09:00', close:'18:00'}], tuesday: [{open:'09:00', close:'18:00'}],
      wednesday: [{open:'09:00', close:'18:00'}], thursday: [{open:'09:00', close:'18:00'}],
      friday: [{open:'09:00', close:'18:00'}], saturday: [{open:'10:00', close:'16:00'}], sunday: [],
    };
  }

  let availableStaff = [];
  if (staffId) {
    const s = await db.select().from(staff).where(and(eq(staff.id, staffId), eq(staff.businessId, businessId), eq(staff.isActive, true))).limit(1);
    if (s.length) availableStaff = s;
  } else {
    const staffServiceRows = await db.select({ staffId: staffServices.staffId }).from(staffServices).where(eq(staffServices.serviceId, serviceId));
    const ids = staffServiceRows.map(r => r.staffId);
    if (ids.length > 0) {
      availableStaff = await db.select().from(staff).where(and(eq(staff.businessId, businessId), inArray(staff.id, ids), eq(staff.isActive, true)));
    }
  }
  if (availableStaff.length === 0) return [];

  const dayOfWeek = dbDayOfWeek(dateTime);
  const slots = [];

  for (const s of availableStaff) {
    const shifts = await db.select().from(staffShifts).where(and(eq(staffShifts.staffId, s.id), eq(staffShifts.dayOfWeek, dayOfWeek)));
    if (shifts.length === 0) continue;
    const timeOffs = await db.select().from(staffTimeOff).where(and(
      eq(staffTimeOff.staffId, s.id),
      lte(staffTimeOff.startAt, nextDay.toISO()),
      gte(staffTimeOff.endAt, dateTime.toISO()),
    ));
    const appointments = await db.select().from(appointmentItems).where(and(
      eq(appointmentItems.staffId, s.id),
      gte(appointmentItems.startAt, dateTime.toISO()),
      lte(appointmentItems.endAt, nextDay.toISO()),
    ));

    for (const shift of shifts) {
      const shiftStart = dateTime.set({ hour: parseInt(shift.startTime.slice(0,2)), minute: parseInt(shift.startTime.slice(3,5)) });
      const shiftEnd = dateTime.set({ hour: parseInt(shift.endTime.slice(0,2)), minute: parseInt(shift.endTime.slice(3,5)) });
      let cursor = shiftStart;
      while (cursor.plus({ minutes: totalBlock }) <= shiftEnd) {
        const blockStart = cursor;
        const serviceStart = blockStart.plus({ minutes: bufferBefore });
        const serviceEnd = serviceStart.plus({ minutes: effectiveDuration });
        const blockEnd = blockStart.plus({ minutes: totalBlock });

        const conflict = appointments.some(app => {
          const appStart = DateTime.fromISO(app.startAt, { zone: 'utc' }).setZone(timezone);
          const appEnd = DateTime.fromISO(app.endAt, { zone: 'utc' }).setZone(timezone);
          return blockStart < appEnd && appStart < blockEnd;
        });
        if (conflict) { cursor = cursor.plus({ minutes: stepMinutes }); continue; }
        const onLeave = timeOffs.some(t => {
          const offStart = DateTime.fromISO(t.startAt, { zone: 'utc' }).setZone(timezone);
          const offEnd = DateTime.fromISO(t.endAt, { zone: 'utc' }).setZone(timezone);
          return blockStart < offEnd && offStart < blockEnd;
        });
        if (onLeave) { cursor = cursor.plus({ minutes: stepMinutes }); continue; }

        let finalPrice = parseFloat(srv.price);
        let discount = 0;
        const rule = await getActivePricingRule(businessId, serviceId, dateTime, serviceStart.toFormat('HH:mm'));
        if (rule) {
          discount = parseFloat(rule.discountPercent);
          finalPrice = finalPrice * (1 - discount / 100);
        }

        slots.push({
          startAt: serviceStart.toUTC().toISO(),
          endAt: serviceEnd.toUTC().toISO(),
          staffId: s.id,
          staffName: s.name,
          price: parseFloat(finalPrice.toFixed(2)),
          originalPrice: parseFloat(srv.price),
          discountPercent: discount,
          isRecommended: false,
          gapQuality: 0,
        });
        cursor = cursor.plus({ minutes: stepMinutes });
      }
    }
  }

  const slotsByStaff = {};
  for (const slot of slots) {
    if (!slotsByStaff[slot.staffId]) slotsByStaff[slot.staffId] = [];
    slotsByStaff[slot.staffId].push(slot);
  }
  for (const staffId in slotsByStaff) {
    const arr = slotsByStaff[staffId].sort((a,b) => a.startAt.localeCompare(b.startAt));
    for (let i = 0; i < arr.length; i++) {
      let gapBefore = 0, gapAfter = 0;
      if (i > 0) gapBefore = DateTime.fromISO(arr[i].startAt).diff(DateTime.fromISO(arr[i-1].endAt), 'minutes').minutes;
      if (i < arr.length - 1) gapAfter = DateTime.fromISO(arr[i+1].startAt).diff(DateTime.fromISO(arr[i].endAt), 'minutes').minutes;
      const quality = Math.min(gapBefore || 999, gapAfter || 999);
      arr[i].gapQuality = quality;
      if (quality <= 30) arr[i].isRecommended = true;
    }
  }

  return slots.sort((a,b) => a.startAt.localeCompare(b.startAt));
}

async function getActivePricingRule(businessId, serviceId, dateTime, timeStr) {
  const day = dbDayOfWeek(dateTime);
  const rules = await db.select().from(pricingRules).where(and(eq(pricingRules.businessId, businessId), eq(pricingRules.isActive, true)));
  for (const rule of rules) {
    const days = rule.daysOfWeek || [];
    const serviceIds = rule.serviceIds || [];
    if (!days.includes(day)) continue;
    if (serviceIds.length > 0 && !serviceIds.includes(serviceId)) continue;
    if (timeStr >= rule.startTime && timeStr <= rule.endTime) return rule;
  }
  return null;
}
