/**
 * Centralized environment variable configuration.
 *
 * Reads all environment variables into a typed object and provides helper
 * functions to check which services are configured.
 *
 * Variables are NOT validated eagerly at startup -- the app will still work in
 * development even when most env vars are missing.  Instead, use the
 * `require*()` helpers to throw a clear error at the point of use (e.g. when
 * someone actually tries to check out via Stripe).
 */

// ---------------------------------------------------------------------------
// Typed env object
// ---------------------------------------------------------------------------

export const env = {
  // ── Database ──────────────────────────────────────────────────────────────
  database: {
    prismaUrl: process.env.POSTGRES_PRISMA_URL || '',
    nonPoolingUrl: process.env.POSTGRES_URL_NON_POOLING || '',
  },

  // ── Authentication ────────────────────────────────────────────────────────
  auth: {
    secret: process.env.AUTH_SECRET || '',
    url: process.env.AUTH_URL || 'http://localhost:3000',
    wholesaleCredentials: process.env.WHOLESALE_CREDENTIALS || '',
  },

  // ── Admin ─────────────────────────────────────────────────────────────────
  admin: {
    password: process.env.ADMIN_PASSWORD || '',
  },

  // ── Stripe ────────────────────────────────────────────────────────────────
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  },

  // ── Email (SMTP) ──────────────────────────────────────────────────────────
  email: {
    smtpHost: process.env.SMTP_HOST || '',
    smtpPort: process.env.SMTP_PORT || '',
    smtpUser: process.env.SMTP_USER || '',
    smtpPass: process.env.SMTP_PASS || '',
    notificationEmail: process.env.NOTIFICATION_EMAIL || '',
  },

  // ── Site ──────────────────────────────────────────────────────────────────
  site: {
    url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    contactEmail: process.env.CONTACT_EMAIL || '',
  },

  // ── Blob Storage ──────────────────────────────────────────────────────────
  blob: {
    readWriteToken: process.env.BLOB_READ_WRITE_TOKEN || '',
  },
} as const;

// ---------------------------------------------------------------------------
// Feature-detection helpers
// ---------------------------------------------------------------------------

/** Returns true when Stripe keys are present. */
export function isStripeConfigured(): boolean {
  return !!env.stripe.secretKey && !!env.stripe.publishableKey;
}

/** Returns true when all required SMTP vars are present. */
export function isEmailConfigured(): boolean {
  return (
    !!env.email.smtpHost &&
    !!env.email.smtpPort &&
    !!env.email.smtpUser &&
    !!env.email.smtpPass &&
    !!env.email.notificationEmail
  );
}

/** Returns true when the Postgres connection string is present. */
export function isDatabaseConfigured(): boolean {
  return !!env.database.prismaUrl;
}

/** Returns true when the admin password is set. */
export function isAdminConfigured(): boolean {
  return !!env.admin.password;
}

/** Returns true when Vercel Blob storage token is present. */
export function isBlobConfigured(): boolean {
  return !!env.blob.readWriteToken;
}

// ---------------------------------------------------------------------------
// Runtime requirement helpers
//
// Call these at the point of use so missing configuration produces a clear
// error message rather than a cryptic undefined crash.
// ---------------------------------------------------------------------------

/**
 * Throw with a helpful message if the given condition is false.
 * Intended for use in API routes / server actions.
 */
function requireConfigured(
  isConfigured: boolean,
  serviceName: string,
  envVarNames: string[],
): void {
  if (!isConfigured) {
    const vars = envVarNames.join(', ');
    throw new Error(
      `[${serviceName}] Not configured. Set the following environment variable(s): ${vars}`,
    );
  }
}

/** Throw if Stripe is not configured. */
export function requireStripe(): void {
  requireConfigured(
    isStripeConfigured(),
    'Stripe',
    ['STRIPE_SECRET_KEY', 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'],
  );
}

/** Throw if the database is not configured. */
export function requireDatabase(): void {
  requireConfigured(
    isDatabaseConfigured(),
    'Database',
    ['POSTGRES_PRISMA_URL'],
  );
}

/** Throw if email/SMTP is not configured. */
export function requireEmail(): void {
  requireConfigured(
    isEmailConfigured(),
    'Email',
    ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'NOTIFICATION_EMAIL'],
  );
}
