# Interim shipping without carrier logins

Local candidate only — October 27, 2026. Direct UPS/FedEx adapters, OAuth scaffold and quote storage remain preserved and disconnected for later. Carrier logins are not required for this interim workflow. No current nationwide numeric tariff is substantiated in this candidate; expired three-ZIP USPS fixtures remain expired and are not used by the cart.

## Customer journey

1. Add products and saved artwork as before. Cart shows an estimated merchandise/setup/rush subtotal and “Shipping: quote required,” with no added shipping figure or free-shipping implication.
2. Continue to `/checkout`, now labeled “Request staff review.” Enter contact details and a complete US destination/address type. All 50 states, DC, territories and military region codes are accepted for review; ZIP+4 is supported. This is intake, not deliverability/service validation. International customers use the existing custom quote form.
3. Submit the existing unpaid invoice request. The server validates destination fields and stores them with the immutable request; shipping, tax and final total remain null. Same-request retries remain idempotent; changed destinations cannot overwrite a submitted request. Existing historical retries without the new fields remain supported. No charge, customer email or production release is triggered by the new code.
4. Staff open Admin → Shipping / invoice requests, then an individual request to review address, saved artwork and quantities. The new list is authenticated, read-only and paginated. Confirm real packing and obtain a shipping price through the team's existing manual process. Remote/AK/HI/territory/military/PO-box/custom/mixed/freight cases receive individual service review; intake does not promise carrier coverage.
5. Staff include confirmed shipping and tax in the existing reviewed final-price process for customer approval before payment. Checkout remains paused and order mail off; this candidate does not activate that later payment flow or grant permission to send messages. Production fulfillment remains staff-held/manual PrintIQ.

## Exact publication scope, if approved later

- Cart copy and CTA; no numeric shipping estimate or new fee.
- Checkout destination fields, required client validation and server validation for new destination data.
- Immutable invoice details include country/address type and server-set staff-quote-required status. Existing JSON payload storage is reused; no schema migration needed.
- Authenticated staff request list and sidebar link; clearer destination/review instructions on detail page. Existing admin authentication unchanged.
- No carrier/API connection, credential changes, provider calls, database migration, checkout/mail flag changes, publication of live rates or automatic fulfillment.

The proposed shipping-quote schema from direct API preparation is NOT needed or applied for this interim workflow. No changes to the expired test allowance.

## Operational choice

Assign a staff owner to check the new request list while order notifications remain off, and manually obtain the shipping quote. No new shipping fee, markup, carrier service, free-shipping promise or refund policy is selected. Publishing this candidate requires explicit publication approval; activating payments or order notifications remains a separate action.
