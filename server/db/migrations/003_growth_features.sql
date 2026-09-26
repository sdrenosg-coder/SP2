ALTER TABLE appointments ADD COLUMN IF NOT EXISTS deposit_amount NUMERIC(10,2) DEFAULT 0;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS deposit_status TEXT DEFAULT 'none';
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS no_show_fee NUMERIC(10,2) DEFAULT 0;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS reschedule_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE gift_cards ADD COLUMN IF NOT EXISTS purchaser_email TEXT;
ALTER TABLE gift_cards ADD COLUMN IF NOT EXISTS recipient_email TEXT;
ALTER TABLE gift_cards ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
-- The unique index only enforces uniqueness within a business, matching the existing per-business gift card scope.
CREATE UNIQUE INDEX IF NOT EXISTS gift_cards_business_code_idx ON gift_cards(business_id, code);

CREATE TABLE IF NOT EXISTS gift_card_transactions (
  id SERIAL PRIMARY KEY,
  gift_card_id INTEGER NOT NULL REFERENCES gift_cards(id) ON DELETE CASCADE,
  appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
  amount NUMERIC(10,2) NOT NULL,
  type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  business_id INTEGER REFERENCES businesses(id) ON DELETE CASCADE,
  actor TEXT,
  action TEXT NOT NULL,
  entity TEXT,
  entity_id TEXT,
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_logs_business_idx ON audit_logs(business_id, created_at DESC);

CREATE TABLE IF NOT EXISTS appointment_manage_tokens (
  id SERIAL PRIMARY KEY,
  token_hash TEXT NOT NULL UNIQUE,
  appointment_id INTEGER NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS appointment_manage_tokens_appt_idx ON appointment_manage_tokens(appointment_id);
