# Stripe unrelated-event routing repair — local only, October 31

Base: deployed b1328241383a2e47809ecd3bcb9fbcf02fc9681d. Branch fix/stripe-unrelated-events. No SEO/shipping commits included.

Cause: the IG account's ordinary payment-link checkout completion reached the Tin destination with empty metadata, yielding HTTP400 business/mode mismatch despite being a paid transaction. This is not a reason to create a Tin order for that payment.

Runtime scope: src/lib/commerce/stripe-events.ts only. After genuine Stripe signature, event account/live-mode and payment-session mode checks, reviewed-only handling returns no Tin event when ALL reserved identifiers are absent: business, orderId, paymentContract, reviewHash, shippingCents, taxCents. Existing webhook action then acknowledges200 without calling commitPaid. Any reserved identifier, even empty/conflicting/partial, takes strict validation. Invalid metadata types reject. Tin amount/proof/contract fields are validated before unpaid events can be ignored; valid unpaid completions never mark paid. Database/reconciliation failures still return503. No catch-all swallowing errors.

Tests: synthetic signed payment-link events with empty/null/missing/ordinary metadata and repeated deliveries; invalid signatures, wrong account/live/session mode; malformed/partial/conflicting Tin fields; valid reviewed total/proof bindings; unpaid malformed/valid cases; actual payment-action HTTP path with zero reconciliation calls for unrelated events and retryable persistence failure for valid Tin events. Existing full-suite replay/concurrent-event/acknowledgment/outbox/pause tests retained. Ported only test-scoped time controls and explicit expiry refusal test from existing validated branch; real October27 deadline unchanged.

Narrow deployment checklist (NOT authorized/executed):
1. Confirm production still b132824/dpl_BPU9do84d9jKYgUaMPep8hCDizr5; if changed, reconcile this one runtime file before release.
2. Approve this webhook-only candidate publication to existing customtintacker/www.customtintackers.com. No settings, secrets, migrations or resources required.
3. Preserve checkout pause1, all ordermail0, existing contact-form mail/auth/manual fulfillment/header. Do not ship shipping or SEO branches.
4. Verify Ready/Current and flags; observe Stripe's subsequent automatic delivery outcome read-only. Do not manually replay or manufacture events under this approval.
5. If regression occurs, restore prior deployment; no database changes to reverse.

Limits/risks: locally verified, not deployed. A completely untagged checkout cannot be safely associated with a Tin order; current Tin creation always stamps all identifiers. Future producers must preserve that contract. Events with unrelated systems using a reserved field will still fail closed rather than be silently ignored. The existing schema/config gate runs before event classification and can independently fail503. This patch does not prove runtime checkout key identity, enable payments/mail, reconcile ordinary IG invoices, or repair historical failures automatically. Admin-login/merchant-readiness and separate launch gates remain. Actual async failure/refund event subscriptions are unchanged; no new accounting policy.
