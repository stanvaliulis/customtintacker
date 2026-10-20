# Reviewed payments: implementation and nonproduction handoff

Updated October 20, 2026 on SPIKE. Stan approved: Invoice me -> staff confirms
proof, shipping and tax -> customer pays the final amount through Stripe -> staff
reviews the PrintIQ handoff. This approval does not authorize live activation.

## Release boundary

Production remains recovery release 0e8eb66. This commerce work is local on
feature/commerce-integration-review; it has not been pushed or deployed. Public
Invoice me and customer recovery are unchanged. Production cards stay disabled.
No production migration, credentials, provider payment, email or PrintIQ write
was performed during this implementation pass.

## Implemented

Staff can prepare proofs against the invoice's owned source and approve explicit
shipping/tax in integer cents. Approval locks source/proof versions and hashes,
product bindings, final amounts and a review hash in one serializable transaction.
Identical approval retries return the original receipt. Changed approvals fail
closed and require staff reconciliation. The current shared administrator login
records authenticated-admin, not a verified individual staff identity.

The customer page shows the approved breakdown and private proof downloads,
requires acknowledgment, and posts only the invoice ID. Server ownership checks
select the frozen amount. A return URL never marks an order paid.

The server Stripe adapter verifies the IG account, uses test mode only, sends
one fixed final USD amount including staff-approved shipping/tax, and disables
Stripe automatic tax, discounts and automatic invoice creation. Metadata carries
order/review references, not customer personal data. A stable order idempotency
key and first-attempt timestamp bound retries to Stripe's retention window;
ambiguous or expired attempts require reconciliation instead of a new charge.

The dedicated webhook validates raw-body signatures, test mode, IG metadata,
review hash and exact amount against a durable order. Payment/event/outbox writes
are atomic; duplicates cannot create a second release. Outbox claims are fenced,
and expired external-operation claims are held. There is no PrintIQ executor.

Payment routes require Preview, an explicit enable flag, and an exact isolated
DB hostname. The known production Neon endpoint is explicitly rejected. Legacy
Stripe routes are untouched; never populate their environment variables for this
test. Approved proof downloads verify stored hashes and bytes before responding.

## Validation and limits

175 synthetic tests and TypeScript validation passed after the Preview storage fix.
Fourteen real local PostgreSQL checks passed, including concurrent reservation,
concurrent staff approval, stale proof heads, duplicate paid events, atomic outbox
rollback, immutable bindings, first-attempt races and claim fencing. The synthetic
PostgreSQL server was stopped. The build result is recorded in
COMMERCE-CONNECTIONS-RESULT.json after completion.

React/JSDOM checks exercise the actual staff/customer components. These are not
end-to-end browser, actual Stripe test payment, or provider-webhook acceptance.
Stripe payment/webhook acceptance remains outside the current approval.

## Future payment configuration (not authorized or executed in this pass)

1. Select a dedicated Vercel Preview of project customtintacker at a fixed HTTPS
   *.vercel.app origin. No production domains or production environment scope.
2. Provision or approve an isolated nonproduction database and private Blob store.
   Do not copy production customer rows, artwork, passwords or storage tokens.
   Apply the existing artwork/invoice workflow schema and required base schema,
   then migrations/payment-ledger-v1.sql to that isolated database only. Verify
   tin_workflow.schema_version=1 and tin_payments.schema_version=1.
3. Enter secrets directly in that Preview's environment, never in chat or source.
   Use dedicated nonproduction values for POSTGRES_PRISMA_URL,
   ARTWORK_BLOB_READ_WRITE_TOKEN, AUTH_SECRET and ADMIN_PASSWORD. Set
   TIN_WORKFLOW_ENABLED=1. Keep mail/recovery sending disabled and leave email
   provider credentials absent. Do not reuse production sessions.
4. In the existing Interstate Graphics Stripe account acct_1TO24PIpmMqjUaQp,
   approve a test-mode key and dedicated test webhook registration. The endpoint
   is https://<fixed-preview-host>/api/payments/stripe-webhook, with events
   checkout.session.completed and checkout.session.async_payment_succeeded.
   Any deployment protection must allow Stripe to reach this endpoint through
   an explicitly approved configuration; do not disable protection implicitly.
5. Set the following Preview-only values:

| Variable | Required value |
| --- | --- |
| TIN_PAYMENTS_TEST_DATABASE_HOST | Exact hostname in the isolated database URL |
| TIN_STRIPE_TEST_SECRET_KEY | IG test secret beginning sk_test_ |
| TIN_STRIPE_TEST_WEBHOOK_SECRET | Dedicated test endpoint secret beginning whsec_ |
| TIN_STRIPE_ACCOUNT_ID | acct_1TO24PIpmMqjUaQp |
| TIN_PAYMENTS_RETURN_ORIGIN | Exact HTTPS Preview origin, no path/query |
| TIN_PAYMENTS_TEST_ENABLED | 1, set last after isolation is verified |
| VERCEL_ENV | Must be preview, supplied by Vercel |

No publishable key is needed for the server-created hosted Checkout redirect.
Do not set STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET or
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: those names belong to legacy routes.

6. Redeploy the same candidate to that Preview after configuration. Use synthetic
   customer/artwork data and Stripe test payment methods only. Verify source and
   proof approval, integer final amount, ownership denial, unchanged request body
   on retry, hosted test checkout, signed webhook delivery/replay and one paid
   transition/outbox. Verify payment remains unpaid after canceled checkout or a
   return URL alone. Confirm PrintIQ execution stays disabled.
7. Disable TIN_PAYMENTS_TEST_ENABLED after acceptance if the Preview is no longer
   needed. Retain synthetic ledger receipts for reconciliation. Production release
   and live keys require a separate review and scoped approval.

## October 20 isolated Preview checkpoint

The earlier 11:42 isolation preflight is historical: inherited Production database
and email credentials were removed from Preview scope, preserving their Production
and Development values/scopes. Dedicated Neon Free database
customtintacker-preview-test and private IAD1 Blob store
customtintacker-preview-artwork (store_vkZMJn6eTVRE1A3K) are connected to Preview
only. Provider database variables retain the sensitive TINTEST prefix and are
aliased server-side after isolation checks. Dedicated AUTH_SECRET and ADMIN_PASSWORD
are Sensitive; no credential values were exported to source or chat.

TIN_WORKFLOW_ENABLED=1; payments, invoice email and recovery email are forced off.
No Stripe keys/webhooks or PrintIQ writes were configured. Preview has Vercel
Authentication protection and no cron schedule. Database bootstrap requires an
empty database or the exact test identity marker; no production data was copied.
Schema versions, private Blob write/read/hash and the real artwork adapter passed.

The first browser save with text exposed a transport-size comparison bug: SDK
size derives from HTTP Content-Length, whereas Fetch returns decoded bytes.
The adapter now requests identity encoding and only compares applicable transfer
lengths; decoded size limits and stored SHA-256 verification remain enforced.
Regression tests cover compressed, absent and inconsistent transfer lengths.

Deployment and browser acceptance evidence is in
../distributor-review-evidence/PREVIEW-DEPLOYMENT-RESULT.json (relative to task root,
not this docs directory). PREVIEW-ISOLATION-CURRENT.json verifies production remains
on dpl_3zuBgkURsKL2SjnE3ukV1SU6M693 and no legacy DB/email keys target Preview.

Budget: US$5 total including tax for seven days, starting October20. Neon Free,
no upgrades; four small Preview builds plus synthetic storage/function requests.
Actual provider billing and tax are delayed and not certified by these checks;
no hard spending cap was configured. Retain test data/resources pending separate
permanent-deletion approval. No future monitoring automation was created.
Staff browser login and final payment acceptance are not claimed; generated
Sensitive admin password was not retained locally or delivered through chat.

## PrintIQ mapping review

Existing authorized reporting access returned HTTP 200. Bounded read-only queries
found IG-INT0001 for Interstate Graphics and two active CorPro candidates,
IG-COR0001 and IG-CPV0001. Staff must select the correct billing entity. No UBC
customer was confirmed by the bounded name search; this does not prove absence.
Historical tacker jobs and .024/.040 aluminum stock variants are candidates only.

Approval must bind each site customer to its IG customer ID/code and each
product/backing to a versioned recipe: approver/date, finish width/height and
confirmed units, ProductCategory, SectionType, FoldCatalog, StockCode,
ProcessFront/Reverse, Pages, section/job operations and emboss treatment.
Keep source, print and emboss revisions/hashes distinct. Artwork transfer and its
PrintIQ receipt are not implemented. Multi-line quoting remains blocked pending
an explicit reconciliation contract.

printiq-plan.ts prepares a disabled single-line review payload only. GetPrice
creates a real numbered quote even without acceptance. Its payload explicitly
disables acceptance, invoice creation, invoice email and export. No quoting,
job conversion, email or unknown-result retry is authorized here. A provider
sandbox or separately approved staff-owned scratch quote is required for writes.

## Evidence

Local distributor-review-evidence contains PAYMENT-LEDGER-DATABASE.json,
COMMERCE-CONNECTIONS-RESULT.json, commerce-connections-tests.log,
commerce-connections-build.log and PRINTIQ-CANDIDATES.json. Shared HANDOFF was
not updated because its prior write denial remains in force.
