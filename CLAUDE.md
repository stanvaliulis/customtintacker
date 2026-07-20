# Custom Tin Tackers — Project Context

## What this is
E-commerce site for Custom Tin Tackers (customtintackers.com) — embossed aluminum tin tacker signs for breweries, bars, restaurants, and promotional product distributors. Made by Interstate Graphics, Machesney Park, IL.

## Tech stack
- **Framework:** Next.js 15 (App Router) + TypeScript
- **Hosting:** Vercel (auto-deploys from `main` branch on GitHub)
- **Database:** Vercel Postgres (Prisma ORM) with JSON file fallback
- **Payments:** Stripe Checkout
- **Email:** Resend (transactional), sending from `notifications@customtintackers.com`
- **Auth:** NextAuth v5 with credentials provider for wholesale/distributor login
- **AI:** Anthropic Claude API (Sonnet 4.6) for the AI Designer feature
- **Canvas:** Fabric.js v6 for the online design editor
- **Repo:** github.com/stanvaliulis/customtintacker

## Key environment variables (Vercel)
- `RESEND_API_KEY` — Resend email sending
- `RESEND_FROM` — `Custom Tin Tackers <notifications@customtintackers.com>`
- `NOTIFICATION_EMAIL` — where inquiry/order emails go (currently sales@customtintackers.com)
- `ANTHROPIC_API_KEY` — Claude API for AI Designer
- `STRIPE_SECRET_KEY` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` / `STRIPE_WEBHOOK_SECRET`
- `POSTGRES_PRISMA_URL` — Vercel Postgres
- `ADMIN_PASSWORD` — /admin panel access
- `WHOLESALE_CREDENTIALS` — distributor login accounts

## Pricing system
- **Source of truth:** Google Sheet "TackerProducts" (owned by kevin.johnson@igiprint.com)
- **List price (public):** Sheet ASI price × 1.4, stored in cents in `src/data/products.ts`
- **Distributor price (logged in):** List price × 0.60 (40% discount = C/R 40%)
- **Only products on the TackerProducts sheet should have pricing.** Products not on the sheet show "Request Pricing"
- 117 total products: 20 standard aluminum, 51 state tackers, 19 vinyl, plus arrows/corrugated/street signs/shields
- Reference sheets created in Stan's Google Drive: "TackerProducts - List Prices (C/R 40%)" and "TackerProducts - Site Only (Needs Sheet Pricing)"

## Key features
- **Online Designer** (`/design/[productId]`) — Fabric.js canvas with shape clipping, text/image/shape tools, templates, auto-save, export (PNG/SVG/print-ready 300 DPI)
- **AI Designer** (`/ai-designer`) — Upload artwork, Claude Vision analyzes it, generates embossed mockup preview with pricing
- **Stripe Checkout** — Full cart → checkout → payment flow, distributor pricing for logged-in users
- **Quote System** — `/quote` form with design ID linking from the designer
- **Distributor Portal** — Wholesale login at `/wholesale/login`, 40% off list pricing, margin display
- **Print-ready Templates** — 115 SVG artwork templates in `public/templates/`
- **Product Images** — 50 brewery/distillery themed SVGs in `public/images/products/generated/`

## Important conventions
- Prices stored in **cents** (integer). $38.79 = 3879
- `pricePerUnit` = list price, `catalogPrice` = same value (both are list)
- Distributor discount comes from session `discountTier` (default 0.40)
- Products without pricing have `pricingTiers: []` and show "Request Pricing"
- Email notifications go through `sendNotificationEmail()` in `src/lib/email.ts`
- All forms have spam protection (honeypot + timing + rate limiting)

## File structure highlights
- `src/data/products.ts` — All 117 products with pricing tiers
- `src/data/design-templates.ts` — 11 Fabric.js design templates
- `src/lib/env.ts` — Centralized environment variable config
- `src/lib/email.ts` — Resend/SMTP email sending
- `src/hooks/useDesignCanvas.ts` — Core Fabric.js canvas hook (~1000 lines)
- `src/components/ai-designer/EmbossedMockup.tsx` — SVG embossed sign preview
- `src/app/api/ai-designer/route.ts` — Claude Vision API integration

## Stan's preferences
- Prefers simple, step-by-step explanations — no jargon
- Wants things done, not discussed at length
- Push changes to live (git push) as you go rather than batching
- PrintIQ can't brand quotes as Custom Tin Tackers — reformat manually when Stan provides a PrintIQ quote
- Kevin Johnson manages the pricing spreadsheet
- IT is handled separately (Microsoft 365 domain setup pending for customtintackers.com email)

## Pending items
- Microsoft 365: Add customtintackers.com as domain (IT task)
- AI Designer: Embossed text effect needs more realism
- AI Designer: Future — embossing zone drawing tool, AI-suggested emboss areas
- Google Sheet live sync (currently manual — update products.ts from sheet)
- Products not on sheet that need pricing added to sheet: see "Site Only" Google Sheet
- Wire generated product images into product listings (replace placeholders)
- Wire template downloads into the design tool (currently shows "coming soon")
