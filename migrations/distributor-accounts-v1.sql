-- REVIEW ONLY. Do not apply automatically or include passwords in SQL/logs.
BEGIN;
CREATE SCHEMA IF NOT EXISTS tin_identity;
REVOKE ALL ON SCHEMA tin_identity FROM PUBLIC;
CREATE TABLE IF NOT EXISTS tin_identity.distributor_account (
  email text PRIMARY KEY CHECK (email = lower(btrim(email))),
  application_id text UNIQUE REFERENCES "DistributorApplication"(id) ON DELETE RESTRICT,
  password_hash text NOT NULL CHECK (password_hash ~ '^\$2[aby]\$12\$[./A-Za-z0-9]{53}$'),
  profile jsonb NOT NULL,
  status text NOT NULL DEFAULT 'approved' CHECK (status IN ('approved', 'disabled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON tin_identity.distributor_account FROM PUBLIC;
COMMIT;
