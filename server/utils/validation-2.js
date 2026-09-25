import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  phone: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const businessSchema = z.object({
  name: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  category: z.string().optional(),
  timezone: z.string().optional(),
  currency: z.string().optional(),
  policies: z.object({
    cancellation_hours: z.number().int().nonnegative().optional(),
    no_show_fee: z.number().nonnegative().optional(),
    deposit_percent: z.number().min(0).max(100).optional(),
  }).optional(),
});

export const staffSchema = z.object({
  name: z.string().min(1),
  title: z.string().optional(),
  color: z.string().optional(),
  commission_rate: z.number().min(0).max(100).optional(),
});

export const serviceSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  duration_minutes: z.number().int().positive(),
  price: z.number().nonnegative(),
  category: z.string().optional(),
  rebook_interval_days: z.number().int().positive().optional(),
  deposit_required: z.boolean().optional(),
  buffer_before: z.number().int().nonnegative().optional(),
  buffer_after: z.number().int().nonnegative().optional(),
});

export const appointmentCreateSchema = z.object({
  clientId: z.number().int(),
  serviceId: z.number().int(),
  staffId: z.number().int().optional(),
  startAt: z.string().datetime({ offset: true }),
  source: z.enum(['widget','marketplace','walk_in','staff']).default('widget'),
  addOns: z.array(z.number()).optional(),
});

export const waitlistCreateSchema = z.object({
  clientId: z.number().int(),
  serviceId: z.number().int().optional(),
  preferredStart: z.string().datetime({ offset: true }).optional(),
  preferredEnd: z.string().datetime({ offset: true }).optional(),
  priority: z.number().int().optional(),
});

export const pricingRuleSchema = z.object({
  name: z.string().min(1),
  days_of_week: z.array(z.number().int().min(0).max(6)),
  start_time: z.string().regex(/^\d{2}:\d{2}$/),
  end_time: z.string().regex(/^\d{2}:\d{2}$/),
  discount_percent: z.number().min(0).max(100),
  service_ids: z.array(z.number().int()).optional(),
  is_active: z.boolean().optional(),
});

export const clientSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  allergies: z.string().optional(),
});
