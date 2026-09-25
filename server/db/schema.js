import { pgTable, serial, text, integer, numeric, boolean, timestamp, jsonb, uuid, time, date, uniqueIndex, index } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  phone: text('phone'),
  roleGlobal: text('role_global').notNull().default('user'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

export const businesses = pgTable('businesses', {
  id: serial('id').primaryKey(),
  slug: text('slug').unique().notNull(),
  name: text('name').notNull(),
  category: text('category').default('Beauty & Wellness'),
  timezone: text('timezone').default('UTC'),
  currency: text('currency').default('USD'),
  branding: jsonb('branding').default({}),
  policies: jsonb('policies').default({}),
  plan: text('plan').default('free'),
  suspended: boolean('suspended').notNull().default(false),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
});

export const businessUsers = pgTable('business_users', {
  id: serial('id').primaryKey(),
  businessId: integer('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: text('role').notNull(),
  commissionRate: numeric('commission_rate').default('0'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  uniqueBusinessUser: uniqueIndex('unique_business_user').on(table.businessId, table.userId),
}));

export const locations = pgTable('locations', {
  id: serial('id').primaryKey(),
  businessId: integer('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  address: text('address'),
  timezone: text('timezone'),
  openingHours: jsonb('opening_hours').default({}),
  createdAt: timestamp('created_at').defaultNow(),
});

export const staff = pgTable('staff', {
  id: serial('id').primaryKey(),
  businessId: integer('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  userId: integer('user_id').references(() => users.id),
  name: text('name').notNull(),
  title: text('title'),
  color: text('color').default('#7c3aed'),
  isActive: boolean('is_active').default(true),
  commissionRate: numeric('commission_rate').default('0'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const staffShifts = pgTable('staff_shifts', {
  id: serial('id').primaryKey(),
  staffId: integer('staff_id').notNull().references(() => staff.id, { onDelete: 'cascade' }),
  locationId: integer('location_id').references(() => locations.id, { onDelete: 'cascade' }),
  dayOfWeek: integer('day_of_week').notNull(),
  startTime: time('start_time').notNull(),
  endTime: time('end_time').notNull(),
  validFrom: date('valid_from'),
  validTo: date('valid_to'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const staffTimeOff = pgTable('staff_time_off', {
  id: serial('id').primaryKey(),
  staffId: integer('staff_id').notNull().references(() => staff.id, { onDelete: 'cascade' }),
  startAt: timestamp('start_at').notNull(),
  endAt: timestamp('end_at').notNull(),
  reason: text('reason'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const services = pgTable('services', {
  id: serial('id').primaryKey(),
  businessId: integer('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  durationMinutes: integer('duration_minutes').notNull(),
  price: numeric('price').notNull(),
  category: text('category'),
  rebookIntervalDays: integer('rebook_interval_days'),
  depositRequired: boolean('deposit_required').default(false),
  bufferBefore: integer('buffer_before').default(0),
  bufferAfter: integer('buffer_after').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

export const serviceVariants = pgTable('service_variants', {
  id: serial('id').primaryKey(),
  serviceId: integer('service_id').notNull().references(() => services.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  priceModifier: numeric('price_modifier').default('0'),
  durationModifier: integer('duration_modifier').default(0),
});

export const addOns = pgTable('add_ons', {
  id: serial('id').primaryKey(),
  businessId: integer('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  price: numeric('price').notNull(),
  durationMinutes: integer('duration_minutes').default(0),
});

export const serviceAddOns = pgTable('service_add_ons', {
  serviceId: integer('service_id').notNull().references(() => services.id, { onDelete: 'cascade' }),
  addOnId: integer('add_on_id').notNull().references(() => addOns.id, { onDelete: 'cascade' }),
}, (table) => ({
  pk: uniqueIndex('service_add_ons_pk').on(table.serviceId, table.addOnId),
}));

export const staffServices = pgTable('staff_services', {
  staffId: integer('staff_id').notNull().references(() => staff.id, { onDelete: 'cascade' }),
  serviceId: integer('service_id').notNull().references(() => services.id, { onDelete: 'cascade' }),
  priceOverride: numeric('price_override'),
  durationOverride: integer('duration_override'),
}, (table) => ({
  pk: uniqueIndex('staff_services_pk').on(table.staffId, table.serviceId),
}));

export const clients = pgTable('clients', {
  id: serial('id').primaryKey(),
  businessId: integer('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  userId: integer('user_id').references(() => users.id),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email'),
  phone: text('phone'),
  notes: text('notes'),
  tags: jsonb('tags').default([]),
  allergies: text('allergies'),
  noShowCount: integer('no_show_count').default(0),
  loyaltyPoints: integer('loyalty_points').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

export const appointments = pgTable('appointments', {
  id: serial('id').primaryKey(),
  businessId: integer('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  locationId: integer('location_id').references(() => locations.id, { onDelete: 'cascade' }),
  clientId: integer('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  status: text('status').notNull().default('booked'),
  source: text('source').default('widget'),
  groupId: uuid('group_id'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const appointmentItems = pgTable('appointment_items', {
  id: serial('id').primaryKey(),
  appointmentId: integer('appointment_id').notNull().references(() => appointments.id, { onDelete: 'cascade' }),
  serviceId: integer('service_id').notNull().references(() => services.id, { onDelete: 'cascade' }),
  staffId: integer('staff_id').notNull().references(() => staff.id, { onDelete: 'cascade' }),
  startAt: timestamp('start_at').notNull(),
  endAt: timestamp('end_at').notNull(),
  price: numeric('price').notNull(),
  discountApplied: numeric('discount_applied').default('0'),
  addOns: jsonb('add_ons').default([]),
});

export const waitlistEntries = pgTable('waitlist_entries', {
  id: serial('id').primaryKey(),
  businessId: integer('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  clientId: integer('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  serviceId: integer('service_id').references(() => services.id, { onDelete: 'cascade' }),
  preferredStart: timestamp('preferred_start'),
  preferredEnd: timestamp('preferred_end'),
  priority: integer('priority').default(100),
  claimToken: uuid('claim_token').defaultRandom(),
  expiresAt: timestamp('expires_at'),
  status: text('status').default('waiting'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const payments = pgTable('payments', {
  id: serial('id').primaryKey(),
  businessId: integer('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  appointmentId: integer('appointment_id').references(() => appointments.id, { onDelete: 'cascade' }),
  amount: numeric('amount').notNull(),
  status: text('status').default('pending'),
  method: text('method').default('cash'),
  stripePaymentIntentId: text('stripe_payment_intent_id'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const invoices = pgTable('invoices', {
  id: serial('id').primaryKey(),
  businessId: integer('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  appointmentId: integer('appointment_id').references(() => appointments.id, { onDelete: 'cascade' }),
  total: numeric('total').notNull(),
  tip: numeric('tip').default('0'),
  status: text('status').default('pending'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const invoiceLines = pgTable('invoice_lines', {
  id: serial('id').primaryKey(),
  invoiceId: integer('invoice_id').notNull().references(() => invoices.id, { onDelete: 'cascade' }),
  description: text('description').notNull(),
  amount: numeric('amount').notNull(),
});

export const giftCards = pgTable('gift_cards', {
  id: serial('id').primaryKey(),
  businessId: integer('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  code: text('code').notNull(),
  balance: numeric('balance').notNull(),
  initialBalance: numeric('initial_balance').notNull(),
  clientId: integer('client_id').references(() => clients.id, { onDelete: 'set null' }),
  expiresAt: timestamp('expires_at'),
  status: text('status').default('active'),
});

export const memberships = pgTable('memberships', {
  id: serial('id').primaryKey(),
  businessId: integer('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  clientId: integer('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  price: numeric('price').notNull(),
  durationDays: integer('duration_days').notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  status: text('status').default('active'),
});

export const loyaltyTransactions = pgTable('loyalty_transactions', {
  id: serial('id').primaryKey(),
  businessId: integer('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  clientId: integer('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  points: integer('points').notNull(),
  reason: text('reason'),
  appointmentId: integer('appointment_id').references(() => appointments.id),
  createdAt: timestamp('created_at').defaultNow(),
});

export const pricingRules = pgTable('pricing_rules', {
  id: serial('id').primaryKey(),
  businessId: integer('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  daysOfWeek: jsonb('days_of_week').notNull(),
  startTime: time('start_time').notNull(),
  endTime: time('end_time').notNull(),
  discountPercent: numeric('discount_percent').notNull(),
  serviceIds: jsonb('service_ids').default([]),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

export const reviews = pgTable('reviews', {
  id: serial('id').primaryKey(),
  businessId: integer('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  clientId: integer('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  appointmentId: integer('appointment_id').references(() => appointments.id),
  rating: integer('rating').notNull(),
  text: text('text'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const campaigns = pgTable('campaigns', {
  id: serial('id').primaryKey(),
  businessId: integer('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: text('type'),
  config: jsonb('config').default({}),
  status: text('status').default('draft'),
  sentAt: timestamp('sent_at'),
});

export const automationRules = pgTable('automation_rules', {
  id: serial('id').primaryKey(),
  businessId: integer('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  triggerType: text('trigger_type').notNull(),
  config: jsonb('config').default({}),
  isActive: boolean('is_active').default(true),
});

export const messageLog = pgTable('message_log', {
  id: serial('id').primaryKey(),
  businessId: integer('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  clientId: integer('client_id').references(() => clients.id),
  appointmentId: integer('appointment_id').references(() => appointments.id),
  type: text('type').notNull(),
  channel: text('channel').notNull(),
  recipient: text('recipient'),
  content: text('content'),
  status: text('status').default('sent'),
  sentAt: timestamp('sent_at').defaultNow(),
});

export const walkInQueue = pgTable('walk_in_queue', {
  id: serial('id').primaryKey(),
  businessId: integer('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  clientName: text('client_name').notNull(),
  phone: text('phone'),
  serviceId: integer('service_id').references(() => services.id),
  joinedAt: timestamp('joined_at').defaultNow(),
  estimatedWaitMinutes: integer('estimated_wait_minutes'),
  status: text('status').default('waiting'),
});
