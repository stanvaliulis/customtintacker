# Stripe and PrintIQ connection review — October 20, 2026

## Live baseline

GitHub main and production remain the released recovery commit `0e8eb66`.
Invoice me remains the working checkout option: unpaid IG/Interstate Graphics
requests, with final shipping/tax and invoice preparation left to staff.
Recovery preserves four accounts and five applications. No replacement setup
emails, password changes, or customer login attempts belong to this work.

## Implemented locally, not activated

`payment-postgres.ts` now implements the durable payment repository and outbox.
The review-only `payment-ledger-v1.sql` adds a separate tin_payments namespace:
immutable order snapshots, unique owner/request/session/payment bindings,
immutable event receipts, and a single outbox row per paid order. Serializable
transactions retry database conflicts; provider actions never run inside them.
An expired claimed outbox item is held for reconciliation rather than resent.
Ten real PostgreSQL tests passed in a new local synthetic database, including
two-client races and atomic rollback after an injected outbox failure. No
production migration has been applied. The rehearsal server was stopped.

`final-payment-review.ts` prepares the staff-reviewed final amount from an
existing invoice request, reconciles item totals, requires explicit shipping/tax,
and binds approved print/emboss artifacts to the invoice's immutable source.
It does not mark an invoice paid, issue a payment link, or release production.

`stripe-events.ts` validates the original request body with Stripe's installed
SDK and a five-minute signature tolerance. It rejects wrong test/live mode,
Connect-account events, non-IG metadata, incomplete payment references,
discounts not represented by the order contract, and inconsistent USD totals.
Unpaid/unrelated events do not mark an order paid. A verified event still needs
the existing transaction contract to compare it to its durable reserved order.
This module makes no provider call and is not wired into the legacy webhook.

`printiq-plan.ts` prepares a review-only GetPrice payload for one paid IG order
line with an explicit IG customer code, product/backing-specific approved recipe,
and separately versioned print/emboss artifact hashes. It binds the source hash
and recipe to a deterministic review hash. Acceptance, invoice creation, invoice
email and invoice export are explicitly false. No HTTP client is included.
Multi-line orders fail closed until add-to-quote reconciliation is implemented.
Even this unaccepted quote payload would create a real numbered quote if sent.

## Verified connection evidence

The existing Stripe browser session displays Interstate Graphics account
`acct_1TO24PIpmMqjUaQp`. No account setting, key or payment was changed.
Production configuration contains none of `STRIPE_SECRET_KEY`,
`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, or `STRIPE_WEBHOOK_SECRET`.
Adding those keys alone is unsafe: the legacy checkout/webhook routes are not
connected to the newer immutable-order transaction service.

The existing Claude PrintIQ API skill was read from the shared
`Dropbox/API/PrintIQAPI/printiq-api.skill` archive without installing it.
Existing local configuration contains all six documented PrintIQ fields.
A `GET /api/v1/odata/Jobs?$top=0` returned 200 using the existing reporting key.
No job rows were requested. QuoteProcess login/write permissions were not tested.
No credentials were copied into source, Vercel or output.

The skill's historical IG sample is not an approved per-product tacker recipe:
its example uses sample customer, stock and finish dimensions. The saved
QuoteProcess Swagger confirms GetPrice creates a quote unless adding to a
specified quote. It has not established provider idempotency or safe automatic
retry after an unknown response.

## Remaining engineering and decisions

1. Stripe: confirm whether payment is collected before or after proof approval;
   approve the shipping and tax calculation policy. Current policy intentionally
   leaves both unresolved; zero is not a valid substitute for an unknown charge.
2. The concrete payment repository and ten-check PostgreSQL rehearsal are now
   complete locally. Production still needs a reviewed migration/recovery point,
   verified runtime wiring, staff authentication and final-amount approval UI.
3. Add the Stripe session provider, replace legacy checkout/webhook/status
   wiring with the durable service, and preserve Invoice me. Customer data must
   remain in the order store rather than serialized into Stripe metadata.
4. Verify IG account/test-mode configuration, configure an approved nonproduction
   webhook and perform test-mode completion/replay/amount-mismatch acceptance.
   A signed synthetic webhook is not an actual Stripe payment acceptance test.
5. PrintIQ: approve exact customer mappings, stock/backing/dimension units,
   operations and recipe versions per tacker product; confirm separate approved
   print/emboss versions and production release authority. Paid invoice requests
   need reconciliation before this paid-order handoff can accept them.
6. Implement a durable PrintIQ handoff ledger and staff-review/claim/reconcile
   flow. An ambiguous GetPrice response must enter a hold, never automatic retry.
   Verify a supported lookup by external order reference and multi-line contract.
   Do not equate an unaccepted quote with a production job.

## Concrete approval boundaries for the next pass

Recommended minimal launch decision: keep Invoice me as the sole public order
submission flow. Staff confirms proof, merchandise/setup/rush, shipping and tax;
the customer then pays the approved final USD amount on Stripe's hosted page.
Only a signed, reconciled payment event marks the order paid. Staff approves the
PrintIQ mapping and handoff afterward. This is a recommendation, not an activated
business policy.

Alternatives: (A) keep staff-issued invoices/payments entirely manual for launch,
which needs no new website payment connection; (B) recommended reviewed-amount
hosted payment above; (C) upfront cart payment, which additionally needs approved
automated shipping/tax and an explicit policy for proof rejection or price changes.
No automatic capture on an unfinished estimate is recommended.

Read-only PrintIQ results identify IG-INT0001 (Interstate Graphics), plus two
active CorPro candidates IG-COR0001 and IG-CPV0001. Do not choose between the latter
by name alone. Bounded searches for UBC/beer/cooling names found no confirmed UBC
match; this is not proof that no differently named account exists. Existing IG
tacker jobs and .024/.040 aluminum stock variants were found. They are historical
mapping candidates, not manufacturing approval or permission to reuse a quote.

Exact mapping fields needed:
- Customer: site account/owner ID -> verified PrintIQ IG customer ID and Code;
  select the correct CorPro billing entity and locate/approve UBC's customer.
- Recipe: site productId and backingId -> version/approver/date, finish width and
  height with confirmed tenant units, ProductCategory, SectionType, FoldCatalog,
  StockCode (distinguish stock definition/sheet size from finish size), ProcessFront,
  ProcessReverse, Pages, section/job operations, and whether embossing is included.
- Artwork: owned source revision/hash plus approved print artifact ID/version/hash
  and, when requested, separate emboss artifact ID/version/hash. Artwork transport
  and PrintIQ attachment receipt still need a verified contract; this review only
  carries references and does not claim that PrintIQ has received the files.
- Handoff: external order reference, approved recipe/customer mapping, quote receipt
  and subsequent explicit production-release authority. Credit terms are not
  implied by Invoice me; this staged handoff requires reconciled payment.

First resolve payment timing, shipping/tax policy and product/customer recipe
mapping. Then finish the dependent implementation before requesting activation.

For provider acceptance testing, the bounded proposed scope is: the existing IG
Stripe account's test mode only; a dedicated nonproduction deployment of project
`customtintacker`; test credentials and webhook secret entered by Stan into that
deployment's environment, never chat; synthetic customer data and test payment
methods; no live charges, automatic customer emails, or production configuration
change. The final credential entry/security grant remains a user handoff.

For PrintIQ, prefer a vendor sandbox. If none exists, approval must name one
staff-owned scratch quote and its exact operations before any write. No guessed
customer, GetPrice call, accept-quote/job conversion, automatic invoice, email,
deletion, or retry is authorized by this review. Existing read-only access is
already working and does not require new keys.

Production activation needs a separate concrete release review after these
tests, including account binding, migration diff, rollback retaining paid records,
worker gates and the precise approved production actions. This document is not
an activation request and does not claim those remaining integrations are ready.

## References

- Stripe Checkout Sessions: https://docs.stripe.com/payments/checkout-sessions
- Stripe create-session contract: https://docs.stripe.com/api/checkout/sessions/create
- Existing PrintIQ skill: `C:\Users\Stan\Dropbox\API\PrintIQAPI\printiq-api.skill`
- Existing QuoteProcess contract: `C:\Users\Stan\Dropbox\API\PrintIQAPI\quoteprocess-v0.swagger.json`
- Local access receipt: `../distributor-review-evidence/INTEGRATION-ACCESS.json`

Shared HANDOFF was not written because the prior write denial remains in force.
