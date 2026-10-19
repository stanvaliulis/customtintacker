-- REVIEW ONLY. Apply after v1, in the approved migration transaction; never automatically.
BEGIN;
ALTER TABLE tin_identity.distributor_account ALTER COLUMN password_hash DROP NOT NULL;
ALTER TABLE tin_identity.distributor_account DROP CONSTRAINT distributor_account_status_check;
ALTER TABLE tin_identity.distributor_account ADD CONSTRAINT distributor_account_status_check CHECK(status IN ('approved','disabled','setup_required'));
ALTER TABLE tin_identity.distributor_account ADD CONSTRAINT approved_requires_password CHECK(status <> 'approved' OR password_hash IS NOT NULL);
ALTER TABLE tin_identity.distributor_account ADD COLUMN session_version integer NOT NULL DEFAULT 1 CHECK(session_version > 0);
CREATE TABLE tin_identity.application_link (
 application_id text PRIMARY KEY REFERENCES "DistributorApplication"(id) ON DELETE RESTRICT,
 email text NOT NULL REFERENCES tin_identity.distributor_account(email) ON DELETE RESTRICT
);
INSERT INTO tin_identity.application_link(application_id,email) SELECT application_id,email FROM tin_identity.distributor_account WHERE application_id IS NOT NULL;
CREATE TABLE tin_identity.password_token (
 token_hash text PRIMARY KEY CHECK(token_hash ~ '^[a-f0-9]{64}$'),
 email text NOT NULL REFERENCES tin_identity.distributor_account(email) ON DELETE RESTRICT,
 expires_at timestamptz NOT NULL, consumed_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX password_token_email ON tin_identity.password_token(email);
CREATE TABLE tin_identity.recovery_job (
 id text PRIMARY KEY, email text NOT NULL REFERENCES tin_identity.distributor_account(email),
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','sending','sent','failed')),
 created_at timestamptz NOT NULL DEFAULT now(), started_at timestamptz, completed_at timestamptz
);
CREATE UNIQUE INDEX recovery_pending_email ON tin_identity.recovery_job(email) WHERE status='pending';
CREATE TABLE tin_identity.recovery_limit (
 bucket_key text PRIMARY KEY, window_start bigint NOT NULL, attempts integer NOT NULL CHECK(attempts>0)
);
CREATE TABLE tin_identity.recovery_audit (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 email text REFERENCES tin_identity.distributor_account(email),
 event text NOT NULL CHECK(event IN ('requested','link_issued','delivery_failed','password_set')),
 created_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON ALL TABLES IN SCHEMA tin_identity FROM PUBLIC;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA tin_identity FROM PUBLIC;
COMMIT;
