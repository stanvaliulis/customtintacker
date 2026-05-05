import { NextResponse } from 'next/server';

// --- Honeypot + timing check ---

interface SpamFields {
  _hp?: string;       // honeypot — must be empty
  _ts?: number;       // timestamp (ms) when form was rendered
}

const MIN_SUBMIT_MS = 3_000; // 3 seconds minimum time on form

/**
 * Returns a 422 response if the submission looks like a bot, or null if it's OK.
 * Call this at the top of every public POST handler.
 */
export function detectSpam(body: SpamFields): NextResponse | null {
  // Honeypot filled → bot
  if (body._hp) {
    return NextResponse.json(
      { error: 'Your message could not be sent. Please try again.' },
      { status: 422 },
    );
  }

  // Form submitted too fast → bot
  if (body._ts) {
    const elapsed = Date.now() - body._ts;
    if (elapsed < MIN_SUBMIT_MS) {
      return NextResponse.json(
        { error: 'Your message could not be sent. Please try again.' },
        { status: 422 },
      );
    }
  }

  return null;
}

// --- In-memory rate limiter (per IP) ---

interface RateEntry {
  count: number;
  resetAt: number;
}

const rateBuckets = new Map<string, RateEntry>();

const WINDOW_MS = 60_000;   // 1-minute window
const MAX_REQUESTS = 5;     // 5 submissions per window per IP

/**
 * Returns a 429 response if rate limited, or null if OK.
 */
export function rateLimit(request: Request): NextResponse | null {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  const now = Date.now();
  const entry = rateBuckets.get(ip);

  if (!entry || now > entry.resetAt) {
    rateBuckets.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return null;
  }

  entry.count++;

  if (entry.count > MAX_REQUESTS) {
    return NextResponse.json(
      { error: 'Too many submissions. Please wait a minute and try again.' },
      { status: 429 },
    );
  }

  return null;
}

// Periodically clean up stale entries (every 5 minutes)
if (typeof globalThis !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of rateBuckets) {
      if (now > entry.resetAt) rateBuckets.delete(ip);
    }
  }, 5 * 60_000).unref?.();
}
