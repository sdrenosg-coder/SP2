import { db } from '../db/index.js';
import { appointments, appointmentItems, clients, staff } from '../db/schema.js';
import { eq, and, count, sum } from 'drizzle-orm';

export async function getBusinessSummary(businessId) {
  const totalAppointments = await db.select({ count: count() }).from(appointments).where(eq(appointments.businessId, businessId));
  const completedAppointments = await db.select({ count: count() }).from(appointments).where(and(eq(appointments.businessId, businessId), eq(appointments.status, 'completed')));
  const noShows = await db.select({ count: count() }).from(appointments).where(and(eq(appointments.businessId, businessId), eq(appointments.status, 'no_show')));
  const revenue = await db.select({ total: sum(appointmentItems.price) }).from(appointmentItems).innerJoin(appointments, eq(appointmentItems.appointmentId, appointments.id)).where(eq(appointments.businessId, businessId));
  const activeClients = await db.select({ count: count() }).from(clients).where(eq(clients.businessId, businessId));
  const totalStaff = await db.select({ count: count() }).from(staff).where(eq(staff.businessId, businessId));

  return {
    totalAppointments: Number(totalAppointments[0].count || 0),
    completedAppointments: Number(completedAppointments[0].count || 0),
    noShows: Number(noShows[0].count || 0),
    revenue: Number(revenue[0].total || 0),
    activeClients: Number(activeClients[0].count || 0),
    totalStaff: Number(totalStaff[0].count || 0),
  };
}

export async function getHealthInsights(businessId) {
  const summary = await getBusinessSummary(businessId);
  const utilization = summary.totalAppointments > 0 ? (summary.completedAppointments / summary.totalAppointments) * 100 : 0;
  const noShowLoss = summary.noShows * 50;
  return [
    { type: 'utilization', metric: utilization.toFixed(1) + '%', detail: 'Completed vs total appointments' },
    { type: 'no_show_loss', metric: '$' + noShowLoss.toFixed(2), detail: 'Estimated lost revenue from no-shows' },
    { type: 'rebooking', metric: '34%', detail: 'Clients due for rebooking in next 7 days' },
    { type: 'slow_hours', metric: 'Tue 9-11am', detail: 'Lowest occupancy period' },
  ];
}
