-- REVIEW ONLY. Not an applied migration. Verify current schema, permissions and backup first.
-- Additive namespace deliberately does not alter existing SavedDesign/Order/customer tables.
CREATE SCHEMA tin_workflow;
REVOKE ALL ON SCHEMA tin_workflow FROM PUBLIC;
CREATE TABLE tin_workflow.schema_version (singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),version integer NOT NULL CHECK(version=1));
CREATE TABLE tin_workflow.owner (id text PRIMARY KEY,disabled boolean NOT NULL DEFAULT false,created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE tin_workflow.revision (
 owner_id text NOT NULL, id text NOT NULL, design_id text NOT NULL,
 kind text NOT NULL CHECK (kind IN ('source','proof')), version integer NOT NULL CHECK(version>0),
 source_id text, payload jsonb NOT NULL,
 PRIMARY KEY(owner_id,id), UNIQUE(owner_id,design_id,kind,version),
 FOREIGN KEY(owner_id) REFERENCES tin_workflow.owner(id),
 FOREIGN KEY(owner_id,source_id) REFERENCES tin_workflow.revision(owner_id,id),
 CHECK((payload->>'ownerId'=owner_id AND payload->>'id'=id AND payload->>'designId'=design_id AND payload->>'kind'=kind) IS TRUE),
 CHECK((payload->>'productionApproval'='unapproved') IS TRUE)
);
CREATE TABLE tin_workflow.head (
 owner_id text NOT NULL, design_id text NOT NULL, kind text NOT NULL CHECK(kind IN ('source','proof')), revision_id text NOT NULL,
 PRIMARY KEY(owner_id,design_id,kind), FOREIGN KEY(owner_id,revision_id) REFERENCES tin_workflow.revision(owner_id,id)
);
CREATE TABLE tin_workflow.receipt (
 owner_id text NOT NULL, request_key text NOT NULL, revision_id text NOT NULL,payload jsonb NOT NULL,
 PRIMARY KEY(owner_id,request_key), FOREIGN KEY(owner_id,revision_id) REFERENCES tin_workflow.revision(owner_id,id)
);
CREATE TABLE tin_workflow.invoice_request (
 owner_id text NOT NULL,id text NOT NULL,request_key text NOT NULL,payload jsonb NOT NULL,
 PRIMARY KEY(owner_id,id),UNIQUE(owner_id,request_key),
 CHECK((payload->>'ownerId'=owner_id AND payload->>'id'=id) IS TRUE),
 CHECK((payload->>'business'='IG' AND payload->>'status'='invoice-requested' AND payload->>'paid'='false' AND payload->>'productionReleased'='false') IS TRUE)
);
CREATE TABLE tin_workflow.outbox (
 job_key text PRIMARY KEY,owner_id text NOT NULL,order_id text NOT NULL,
 state text NOT NULL DEFAULT 'pending' CHECK(state IN ('pending','sending','held','delivered')),
 due_at bigint NOT NULL DEFAULT 0,attempts integer NOT NULL DEFAULT 0,
 lease_token text,lease_until bigint,first_attempt bigint,message_id text,
 FOREIGN KEY(owner_id,order_id) REFERENCES tin_workflow.invoice_request(owner_id,id)
);
CREATE INDEX outbox_due ON tin_workflow.outbox(due_at) WHERE state IN ('pending','sending');
CREATE INDEX revision_source ON tin_workflow.revision(owner_id,source_id) WHERE source_id IS NOT NULL;
CREATE INDEX outbox_order ON tin_workflow.outbox(owner_id,order_id);
CREATE FUNCTION tin_workflow.reject_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Immutable workflow record'; END $$;
CREATE TRIGGER revision_immutable BEFORE UPDATE OR DELETE ON tin_workflow.revision FOR EACH ROW EXECUTE FUNCTION tin_workflow.reject_mutation();
CREATE TRIGGER receipt_immutable BEFORE UPDATE OR DELETE ON tin_workflow.receipt FOR EACH ROW EXECUTE FUNCTION tin_workflow.reject_mutation();
CREATE TRIGGER invoice_immutable BEFORE UPDATE OR DELETE ON tin_workflow.invoice_request FOR EACH ROW EXECUTE FUNCTION tin_workflow.reject_mutation();
-- Do not grant PUBLIC or browser roles access. Exact application/worker role grants require review.
-- Rollback the application first; retain this namespace and newly received artwork/orders.
REVOKE ALL ON ALL TABLES IN SCHEMA tin_workflow FROM PUBLIC;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA tin_workflow FROM PUBLIC;
INSERT INTO tin_workflow.schema_version(singleton,version) VALUES(true,1);
