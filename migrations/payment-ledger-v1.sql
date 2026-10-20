-- REVIEW ONLY. Synthetic rehearsal first; never run automatically on startup.
BEGIN;
CREATE SCHEMA tin_payments;
REVOKE ALL ON SCHEMA tin_payments FROM PUBLIC;
CREATE TABLE tin_payments.schema_version(version integer PRIMARY KEY CHECK(version=1));
INSERT INTO tin_payments.schema_version VALUES(1);
CREATE TABLE tin_payments.payment_order (
 id text PRIMARY KEY, owner_id text NOT NULL, request_key text NOT NULL,
 request_hash text NOT NULL CHECK(request_hash ~ '^[a-f0-9]{64}$'), snapshot jsonb NOT NULL,
 session_id text UNIQUE, checkout_url text, payment_id text UNIQUE, paid boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(owner_id,request_key),
 CHECK(snapshot->>'business'='IG' AND snapshot->>'currency'='usd'),
 CHECK(snapshot->>'ownerId'=owner_id AND snapshot->>'id'=id AND snapshot->>'requestHash'=request_hash),
 CHECK(NOT paid OR (session_id IS NOT NULL AND payment_id IS NOT NULL)),
 CHECK((session_id IS NULL)=(checkout_url IS NULL))
);
CREATE TABLE tin_payments.payment_event (
 id text PRIMARY KEY, payload_hash text NOT NULL CHECK(payload_hash ~ '^[a-f0-9]{64}$'),
 order_id text NOT NULL REFERENCES tin_payments.payment_order(id), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE tin_payments.outbox (
 job_key text PRIMARY KEY, order_id text NOT NULL UNIQUE REFERENCES tin_payments.payment_order(id),
 state text NOT NULL DEFAULT 'pending' CHECK(state IN ('pending','claimed','held','completed')),
 lease_token text, lease_until timestamptz, provider_receipt text,
 created_at timestamptz NOT NULL DEFAULT now(), completed_at timestamptz
);
CREATE FUNCTION tin_payments.guard_order() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Payment records must be retained'; END IF;
 IF NEW.id IS DISTINCT FROM OLD.id OR NEW.owner_id IS DISTINCT FROM OLD.owner_id OR
    NEW.request_key IS DISTINCT FROM OLD.request_key OR NEW.request_hash IS DISTINCT FROM OLD.request_hash OR
    NEW.snapshot IS DISTINCT FROM OLD.snapshot OR NEW.created_at IS DISTINCT FROM OLD.created_at OR
    (OLD.paid AND NOT NEW.paid) OR
    (OLD.session_id IS NOT NULL AND (NEW.session_id IS DISTINCT FROM OLD.session_id OR NEW.checkout_url IS DISTINCT FROM OLD.checkout_url)) OR
    (OLD.payment_id IS NOT NULL AND NEW.payment_id IS DISTINCT FROM OLD.payment_id)
 THEN RAISE EXCEPTION 'Immutable payment binding'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER payment_order_guard BEFORE UPDATE OR DELETE ON tin_payments.payment_order FOR EACH ROW EXECUTE FUNCTION tin_payments.guard_order();
CREATE FUNCTION tin_payments.guard_event() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Payment event receipts must be retained unchanged'; END $$;
CREATE TRIGGER payment_event_guard BEFORE UPDATE OR DELETE ON tin_payments.payment_event FOR EACH ROW EXECUTE FUNCTION tin_payments.guard_event();
REVOKE ALL ON ALL TABLES IN SCHEMA tin_payments FROM PUBLIC;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA tin_payments FROM PUBLIC;
COMMIT;
