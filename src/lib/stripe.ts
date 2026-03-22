import Stripe from 'stripe';
import { env, isStripeConfigured } from './env';

/**
 * Stripe client instance.
 *
 * - When STRIPE_SECRET_KEY is configured, exports a live Stripe client.
 * - When it is NOT configured, exports `null` and logs a warning once.
 *
 * Callers that require Stripe (e.g. the checkout API route) should
 * null-check or call `requireStripe()` from `@/lib/env` before use.
 */

function createStripeClient(): Stripe | null {
  if (!isStripeConfigured()) {
    console.warn(
      '[Stripe] Not configured. Set STRIPE_SECRET_KEY and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to enable payments.',
    );
    return null;
  }

  return new Stripe(env.stripe.secretKey, {
    typescript: true,
  });
}

export const stripe = createStripeClient();
