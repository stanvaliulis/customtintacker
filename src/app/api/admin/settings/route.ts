import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { env, isStripeConfigured } from '@/lib/env';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'settings.json');

/* ---------- Default Settings ---------- */

const defaultSettings: Record<string, string> = {
  // Company Info
  'company.name': 'Interstate Graphics',
  'company.tagline': 'Premium Custom Embossed Aluminum Signs',
  'company.email': 'sales@interstategraphics.com',
  'company.phone': '(555) 123-4567',
  'company.address.street': '123 Industrial Blvd',
  'company.address.city': 'Anytown',
  'company.address.state': 'USA',
  'company.address.zip': '12345',
  'company.website': 'https://customtintackers.com',

  // Order Settings
  'order.minimumQuantity': '25',
  'order.defaultLeadTime': '14',
  'order.taxRate': '0',
  'order.defaultSetupFee': '75',
  'order.wholesaleDiscount': '15',
  'order.distributorDiscount': '25',

  // SEO
  'seo.metaTitle': 'Custom Tin Tackers | Premium Embossed Aluminum Signs',
  'seo.metaDescription':
    'Premium custom embossed aluminum tin tacker signs. Made in the USA. Perfect for breweries, bars, and brand promotion.',
  'seo.ogImageUrl': '',
};

/* ---------- Read / Write Helpers ---------- */

async function readSettings(): Promise<Record<string, string>> {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf-8');
    const saved = JSON.parse(raw) as Record<string, string>;
    // Merge defaults with saved values so new keys always exist
    return { ...defaultSettings, ...saved };
  } catch {
    return { ...defaultSettings };
  }
}

async function writeSettings(settings: Record<string, string>): Promise<void> {
  const dir = path.dirname(DATA_FILE);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(settings, null, 2), 'utf-8');
}

/* ---------- GET — return all settings ---------- */

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const settings = await readSettings();

  // Append read-only env-var info for the frontend
  const envInfo: Record<string, string | boolean> = {
    'env.smtpHost': env.email.smtpHost,
    'env.smtpPort': env.email.smtpPort || '587',
    'env.smtpFrom': process.env.SMTP_FROM || env.email.smtpUser || '',
    'env.smtpUser': env.email.smtpUser,
    'env.notificationRecipients': env.email.notificationEmail || process.env.NOTIFICATION_RECIPIENTS || '',
    'env.stripeConnected': isStripeConfigured(),
    'env.stripeWebhookUrl': process.env.NEXT_PUBLIC_STRIPE_WEBHOOK_URL || '',
  };

  return NextResponse.json({ settings, env: envInfo });
}

/* ---------- PUT — update settings ---------- */

export async function PUT(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const current = await readSettings();

    // Accept either { key, value } or an array of { key, value }
    if (Array.isArray(body)) {
      for (const item of body) {
        if (item.key && typeof item.key === 'string') {
          current[item.key] = String(item.value);
        }
      }
    } else if (body.key && typeof body.key === 'string') {
      current[body.key] = String(body.value);
    } else if (typeof body === 'object' && body !== null && !body.key) {
      // Accept a flat object of key-value pairs (bulk update)
      for (const [k, v] of Object.entries(body)) {
        if (typeof k === 'string' && k in defaultSettings) {
          current[k] = String(v);
        }
      }
    }

    await writeSettings(current);

    return NextResponse.json({ success: true, settings: current });
  } catch (err) {
    console.error('Failed to update settings:', err);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
