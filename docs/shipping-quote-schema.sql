-- LOCAL REVIEW ONLY: not applied. No grants, no credentials, no remote writes.
-- Scope: nonpayable estimates, never payment or fulfillment authority.
CREATE SCHEMA IF NOT EXISTS tin_shipping;
CREATE TABLE IF NOT EXISTS tin_shipping.quote (
 id uuid PRIMARY KEY,
 owner_id text NOT NULL,
 expires_at timestamptz NOT NULL,
 payload jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS shipping_quote_expiry ON tin_shipping.quote(expires_at);
-- Proposed retention job after separate setup approval: delete expired rows.
-- Payload contains an opaque owner, binding hash and rates; no full address.
