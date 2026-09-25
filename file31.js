// server/services/notificationService.js (add missing sendRebookNudge)
import { db } from '../db/index.js';
import { messageLog, businesses, clients, appointments } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { config } from '../config.js';
import nodemailer from 'nodemailer';

const emailTransporter = config.emailEnabled
  ? nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false,
      auth: { user: 'apikey', pass: config.sendgridApiKey },
    })
  : null;

async function logMessage({ businessId, clientId, appointmentId, type, channel, recipient, content }) {
  await db.insert(messageLog).values({ businessId, clientId, appointmentId, type, channel, recipient, content });
}

async function sendEmail(to, subject, html) {
  if (emailTransporter) {
    await emailTransporter.sendMail({ from: 'Bookly <no-reply@bookly.demo>', to, subject, html });
  } else {
    console.log(`[EMAIL to ${to}] ${subject}\n${html}`);
  }
}

export async function sendBookingConfirmation({ businessId, clientId, appointmentId }) {
  const business = await db.select().from(businesses).where(eq(businesses.id, businessId)).limit(1);
  const client = await db.select().from(clients).where(eq(clients.id, clientId)).limit(1);
  if (!business.length || !client.length) return;
  const b = business[0], c = client[0];
  const content = `Hi ${c.firstName}, your appointment at ${b.name} is confirmed.`;
  await sendEmail(c.email || 'customer@example.com', 'Appointment Confirmed', content);
  await logMessage({ businessId, clientId, appointmentId, type: 'confirmation', channel: 'email', recipient: c.email, content });
}

export async function sendReminder({ businessId, clientId, appointmentId, hoursBefore }) {
  const business = await db.select().from(businesses).where(eq(businesses.id, businessId)).limit(1);
  const client = await db.select().from(clients).where(eq(clients.id, clientId)).limit(1);
  if (!business.length || !client.length) return;
  const b = business[0], c = client[0];
  const content = `Reminder: your appointment at ${b.name} is in ${hoursBefore} hours.`;
  await sendEmail(c.email || 'customer@example.com', 'Appointment Reminder', content);
  await logMessage({ businessId, clientId, appointmentId, type: `reminder_${hoursBefore}h`, channel: 'email', recipient: c.email, content });
}

export async function sendRebookNudge({ businessId, clientId, appointmentId }) {
  const business = await db.select().from(businesses).where(eq(businesses.id, businessId)).limit(1);
  const client = await db.select().from(clients).where(eq(clients.id, clientId)).limit(1);
  if (!business.length || !client.length) return;
  const b = business[0], c = client[0];
  const content = `Hi ${c.firstName}, it's time to rebook your appointment at ${b.name}. Click here to book.`;
  await sendEmail(c.email || 'customer@example.com', 'Time to Rebook', content);
  await logMessage({ businessId, clientId, appointmentId, type: 'rebook_nudge', channel: 'email', recipient: c.email, content });
}

export async function sendWaitlistOffer({ businessId, clientId, claimToken, expiresAt }) {
  console.log(`Waitlist offer for client ${clientId}: token ${claimToken}, expires ${expiresAt}`);
}
