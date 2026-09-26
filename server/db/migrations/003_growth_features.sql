ALTER TABLE appointments ADD COLUMN IF NOT EXISTS deposit_amount NUMERIC DEFAULT 0;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS deposit_status TEXT DEFAULT 'none';
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS no_show_fee NUMERIC DEFAULT 0;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS reschedule_count INTEGER DEFAULT 0;

CREATE TABLE IF NOT EXISTS gift_cards (
  id SERIAL PRIMARY KEY,
  business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  initial_amount NUMERIC NOT NULL,
  balance NUMERIC NOT NULL,
  purchaser_email TEXT,
  recipient_email TEXT,
  expires_at TIMESTAMP,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gift_card_transactions (
  id SERIAL PRIMARY KEY,
  gift_card_id INTEGER NOT NULL REFERENCES gift_cards(id) ON DELETE CASCADE,
  appointment_id INTEGER,
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  business_id INTEGER REFERENCES businesses(id) ON DELETE CASCADE,
  actor TEXT,
  action TEXT NOT NULL,
  entity TEXT,
  entity_id TEXT,
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS audit_logs_business_idx ON audit_logs(business_id, created_at DESC);
