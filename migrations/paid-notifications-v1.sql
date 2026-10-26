-- Additive; no historical backfill and no fulfillment-state changes.
-- Review/apply to the explicitly selected database before deploying the adapter.
CREATE TABLE IF NOT EXISTS tin_payments.notification_outbox (
 job_key text PRIMARY KEY,
 order_id text NOT NULL UNIQUE REFERENCES tin_payments.payment_order(id),
 state text NOT NULL DEFAULT 'pending' CHECK(state IN ('pending','sending','held','delivered')),
 attempts integer NOT NULL DEFAULT 0,
 next_attempt_at timestamptz NOT NULL DEFAULT now(),
 lease_token text,
 lease_until timestamptz,
 binding jsonb,
 provider_receipt text,
 last_code text,
 created_at timestamptz NOT NULL DEFAULT now()
);
