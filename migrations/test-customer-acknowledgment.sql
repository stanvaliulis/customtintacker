-- Isolated test database only. Production migration needs separate review.
BEGIN;
DO $$ BEGIN
 IF (SELECT id FROM tin_preview.identity) <> 'customtintacker-preview-test-20261020' THEN
  RAISE EXCEPTION 'Wrong database identity';
 END IF;
END $$;
CREATE TABLE IF NOT EXISTS tin_payments.customer_acknowledgment (
 invoice_id text NOT NULL REFERENCES tin_payments.final_review(invoice_id),
 owner_id text NOT NULL,
 review_hash text NOT NULL CHECK (review_hash ~ '^[a-f0-9]{64}$'),
 acknowledged_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(invoice_id,owner_id,review_hash)
);
REVOKE ALL ON tin_payments.customer_acknowledgment FROM PUBLIC;
COMMIT;
