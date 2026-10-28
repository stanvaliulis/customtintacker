# SEO/AEO buyer-intent expansion — October 28, 2026

Status: LOCAL ONLY. Branch seo/buyer-intent-coverage, based on published header b1328241383a2e47809ecd3bcb9fbcf02fc9681d. No shipping commits, deployment, database writes, payment/mail/config changes.

Fresh public baseline: five affected pages returned HTTP200 with www self-canonicals. Evidence: ../distributor-review-evidence/SEO-LIVE-BASELINE.json. Search tool cached catalog copy differed from fresh HTTPS; the fresh response is the deployment evidence.

Before -> after:
- /products: existing terminology links -> substantive construction/use-case guide covering embossed metal/aluminum, brewery/beer, promotional/bar, die-cut and bottle-cap intent, with links to existing pages and the existing educational guide. Broad all-embossed catalog introduction corrected to distinguish flat/vinyl.
- /brewery-signs: long repetitive title -> Custom Brewery Signs & Metal Beer Signs; artwork/display-size advice and cross-links to real products.
- /bar-signs: generic headline and blanket embossing claim -> Branded Bar Signs for Bars & Pubs, concise metadata, construction selection and promotion advice.
- /products/custom-shape-tacker: explicit custom die-cut explanation and team review requirement.
- /products/22-inch-bottle-cap-tacker: bottle-cap outline distinguished from embossing; listed product explicitly flat.
- Existing /blog/what-is-a-tin-tacker-sign and /artwork-templates receive contextual links. No new landing pages/filter URLs or duplicate schema added. Product schema remains sourced from the actual product record.

Owner facts shared from manufacturing-facts.ts: direct print, .024-inch aluminum white both sides (not two-sided artwork); 2–3 weeks standard / 1–2 weeks rush +30%, proof approval to shipment, transit additional. Construction remains product-specific.

Validation: 26 focused tests pass; full suite 215/217, only the two existing payment-ui date-dependent failures (expired test window) remain. No production expiry changes. TypeScript and guarded credential-free production build pass. Four generated industry/product HTML pages have parseable JSON-LD and contextual canonical links; SEO-RENDERED-CHECKS.json. Header untouched.

Official guidance checked Oct28:
https://developers.google.com/search/docs/appearance/ai-features
https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls
https://developers.google.com/search/updates
Google requires no special AI schema/file; ordinary crawlable useful content and visible/schema agreement apply. FAQ rich results retired May7,2026; no benefit claimed from existing FAQ markup. No rankings, impressions, index coverage or AI citations measured (no Search Console/analytics access used).

Remaining factual questions: unresolved setup-fee promises and product-specific MOQ exceptions; no universal changes made. Existing industry copy has no-setup-fee language requiring owner review. No manufacturing/availability/refund promises inferred. Public catalog responses do not prove underlying database fields were reviewed.

Narrow proposed publication: only these seven SEO content/component/test files on production header base. Keep shipping unpublished, checkout paused, order mail off, contact mail/auth/upload default/fulfillment unchanged. Publication requires separate approval.
