-- Apply only to the identity-verified isolated test database. No credential in this file.
BEGIN;
DO $$ BEGIN
 IF (SELECT count(*) FROM tin_preview.identity WHERE id='customtintacker-preview-test-20261020')<>1
 OR (SELECT version FROM tin_payments.schema_version)<>1 THEN RAISE EXCEPTION 'Wrong test database'; END IF;
END $$;
CREATE SCHEMA IF NOT EXISTS tin_test_receiver;
REVOKE ALL ON SCHEMA tin_test_receiver FROM PUBLIC;
CREATE OR REPLACE FUNCTION tin_test_receiver.reconcile(e jsonb) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE o tin_payments.payment_order%ROWTYPE; prior text; fingerprint text;
BEGIN
 IF clock_timestamp()>='2026-10-27T13:00:00Z'::timestamptz THEN RAISE EXCEPTION 'Test window expired'; END IF;
 IF (SELECT count(*) FROM tin_preview.identity WHERE id='customtintacker-preview-test-20261020')<>1 THEN RAISE EXCEPTION 'Wrong test database'; END IF;
 IF NOT (e ?& ARRAY['id','type','sessionId','orderId','paymentIntentId','paymentStatus','currency','total','shipping','tax','reviewHash'])
 OR (e->>'id') !~ '^evt_[A-Za-z0-9_]{1,200}$' OR (e->>'sessionId') !~ '^cs_test_[A-Za-z0-9_]{1,200}$'
 OR (e->>'paymentIntentId') !~ '^pi_[A-Za-z0-9_]{1,200}$' OR (e->>'reviewHash') !~ '^[a-f0-9]{64}$'
 OR e->>'type' NOT IN ('checkout.session.completed','checkout.session.async_payment_succeeded')
 OR e->>'paymentStatus'<>'paid' OR e->>'currency'<>'usd'
 OR (e->>'total') !~ '^[0-9]{1,15}$' OR (e->>'shipping') !~ '^[0-9]{1,15}$' OR (e->>'tax') !~ '^[0-9]{1,15}$'
 OR EXISTS (SELECT 1 FROM jsonb_each(e) kv WHERE kv.value='null'::jsonb)
 THEN RAISE EXCEPTION 'Invalid test event'; END IF;
 -- Lock by event first, then the existing order; no dynamic SQL or caller-selected objects.
 PERFORM pg_advisory_xact_lock(hashtextextended(e->>'id',0));
 fingerprint:=encode(sha256(convert_to(e::text,'UTF8')),'hex');
 SELECT payload_hash INTO prior FROM tin_payments.payment_event WHERE id=e->>'id';
 IF FOUND THEN
  IF prior<>fingerprint THEN RAISE EXCEPTION 'Event collision'; END IF;
  RETURN 'duplicate';
 END IF;
 SELECT * INTO o FROM tin_payments.payment_order WHERE id=e->>'orderId' FOR UPDATE;
 IF NOT FOUND OR o.session_id IS DISTINCT FROM e->>'sessionId'
 OR o.request_hash IS DISTINCT FROM e->>'reviewHash'
 OR o.snapshot->>'business' IS DISTINCT FROM 'IG' OR o.snapshot->>'currency' IS DISTINCT FROM 'usd'
 OR o.snapshot->>'paymentTiming' IS DISTINCT FROM 'proof-approved'
 OR (o.snapshot->>'total')::bigint IS DISTINCT FROM (e->>'total')::bigint
 OR (o.snapshot->>'shipping')::bigint IS DISTINCT FROM (e->>'shipping')::bigint
 OR (o.snapshot->>'tax')::bigint IS DISTINCT FROM (e->>'tax')::bigint
 OR (o.payment_id IS NOT NULL AND o.payment_id IS DISTINCT FROM e->>'paymentIntentId')
 OR NOT EXISTS (SELECT 1 FROM tin_payments.final_review r WHERE r.owner_id=o.owner_id AND r.review_hash=o.request_hash AND 'invoice-'||r.invoice_id=o.request_key)
 THEN RAISE EXCEPTION 'Payment binding mismatch'; END IF;
 -- Existing identical event receipts return above without changing historical payments.
 -- New callbacks must bind to the owner acknowledgment of this exact frozen review.
 PERFORM 1 FROM tin_payments.customer_acknowledgment a
 JOIN tin_payments.final_review r ON r.invoice_id=a.invoice_id AND r.owner_id=a.owner_id AND r.review_hash=a.review_hash
 WHERE a.owner_id=o.owner_id AND a.review_hash=o.request_hash AND 'invoice-'||a.invoice_id=o.request_key
 FOR SHARE OF a,r;
 IF NOT FOUND THEN RAISE EXCEPTION 'Current customer acknowledgment required'; END IF;
 INSERT INTO tin_payments.payment_event(id,payload_hash,order_id) VALUES(e->>'id',fingerprint,o.id);
 IF o.paid THEN RETURN 'duplicate'; END IF;
 UPDATE tin_payments.payment_order SET paid=true,payment_id=e->>'paymentIntentId',updated_at=clock_timestamp() WHERE id=o.id;
 -- Permanently held: this receiver can never authorize a production handoff.
 INSERT INTO tin_payments.outbox(job_key,order_id,state) VALUES('paid:'||o.id,o.id,'held') ON CONFLICT(job_key) DO NOTHING;
 RETURN 'applied';
END $$;
REVOKE ALL ON FUNCTION tin_test_receiver.reconcile(jsonb) FROM PUBLIC;
-- Existing test ledgers also default to held; no historical handoff state is rewritten.
ALTER TABLE tin_payments.outbox ALTER COLUMN state SET DEFAULT 'held';
COMMIT;
