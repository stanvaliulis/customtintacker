'use client';

import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Settings,
  Building2,
  Mail,
  DollarSign,
  AlertTriangle,
  Save,
  RotateCcw,
  Trash2,
  CreditCard,
  Search,
  Loader2,
  CheckCircle2,
  XCircle,
  Info,
  Shield,
} from 'lucide-react';

/* ---------- Types ---------- */

interface SettingsData {
  [key: string]: string;
}

interface EnvData {
  [key: string]: string | boolean;
}

/* ---------- Default values (used for reset) ---------- */

const defaults: SettingsData = {
  'company.name': 'Interstate Graphics',
  'company.tagline': 'Premium Custom Embossed Aluminum Signs',
  'company.email': 'sales@interstategraphics.com',
  'company.phone': '(555) 123-4567',
  'company.address.street': '123 Industrial Blvd',
  'company.address.city': 'Anytown',
  'company.address.state': 'USA',
  'company.address.zip': '12345',
  'company.website': 'https://customtintackers.com',
  'order.minimumQuantity': '25',
  'order.defaultLeadTime': '14',
  'order.taxRate': '0',
  'order.defaultSetupFee': '75',
  'order.wholesaleDiscount': '15',
  'order.distributorDiscount': '25',
  'seo.metaTitle': 'Custom Tin Tackers | Premium Embossed Aluminum Signs',
  'seo.metaDescription':
    'Premium custom embossed aluminum tin tacker signs. Made in the USA. Perfect for breweries, bars, and brand promotion.',
  'seo.ogImageUrl': '',
};

/* ---------- Reusable Field Components ---------- */

function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  prefix,
  suffix,
  readOnly = false,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  prefix?: string;
  suffix?: string;
  readOnly?: boolean;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1.5">{label}</label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
            {prefix}
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          readOnly={readOnly}
          className={`w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white
            focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none transition-colors
            placeholder:text-gray-600
            ${prefix ? 'pl-7' : ''}
            ${suffix ? 'pr-12' : ''}
            ${readOnly ? 'opacity-60 cursor-not-allowed' : ''}
          `}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
            {suffix}
          </span>
        )}
      </div>
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

function TextareaField({
  label,
  value,
  onChange,
  rows = 3,
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1.5">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white
          focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none transition-colors
          placeholder:text-gray-600 resize-none"
      />
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

function ReadOnlyEnvField({ label, value, envVar }: { label: string; value: string; envVar: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1.5">
        {label}
        <code className="ml-2 text-[11px] font-mono text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded">
          {envVar}
        </code>
      </label>
      <input
        type="text"
        value={value || 'Not configured'}
        readOnly
        className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm text-gray-400
          cursor-not-allowed outline-none"
      />
    </div>
  );
}

/* ---------- Section Wrapper ---------- */

function Section({
  icon: Icon,
  title,
  description,
  badge,
  children,
  onSave,
  saving,
  saveLabel = 'Save Changes',
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
  onSave?: () => void;
  saving?: boolean;
  saveLabel?: string;
}) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center">
            <Icon className="w-4 h-4 text-gray-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">{title}</h2>
            {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
          </div>
        </div>
        {badge}
      </div>
      <div className="p-6 space-y-4">{children}</div>
      {onSave && (
        <div className="px-6 py-4 border-t border-gray-800 flex justify-end">
          <button
            onClick={onSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm
              font-medium hover:bg-amber-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saveLabel}
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------- Status Pill ---------- */

function StatusPill({ connected }: { connected: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
        connected
          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
          : 'bg-gray-800 text-gray-500 border border-gray-700'
      }`}
    >
      {connected ? (
        <CheckCircle2 className="w-3 h-3" />
      ) : (
        <XCircle className="w-3 h-3" />
      )}
      {connected ? 'Connected' : 'Not Connected'}
    </span>
  );
}

/* ---------- Main Settings Page ---------- */

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData>({ ...defaults });
  const [envData, setEnvData] = useState<EnvData>({});
  const [loading, setLoading] = useState(true);
  const [savingSections, setSavingSections] = useState<Record<string, boolean>>({});

  /* -- Load settings -- */
  const loadSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/settings');
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setSettings({ ...defaults, ...data.settings });
      setEnvData(data.env || {});
    } catch {
      // Use defaults if API is unavailable
      toast.error('Could not load settings from server. Using defaults.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  /* -- Generic save helper -- */
  async function saveSection(sectionName: string, keys: string[]) {
    setSavingSections((prev) => ({ ...prev, [sectionName]: true }));
    try {
      const updates = keys.map((key) => ({ key, value: settings[key] }));
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Save failed');
      toast.success(`${sectionName} saved successfully`);
    } catch {
      toast.error(`Failed to save ${sectionName.toLowerCase()}`);
    } finally {
      setSavingSections((prev) => ({ ...prev, [sectionName]: false }));
    }
  }

  /* -- Field change helper -- */
  function update(key: string, value: string) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  /* -- Danger zone actions -- */
  async function handleResetDefaults() {
    if (!confirm('Reset all settings to factory defaults? This will overwrite your current settings.')) return;
    setSavingSections((prev) => ({ ...prev, reset: true }));
    try {
      const updates = Object.entries(defaults).map(([key, value]) => ({ key, value }));
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Reset failed');
      setSettings({ ...defaults });
      toast.success('All settings reset to defaults');
    } catch {
      toast.error('Failed to reset settings');
    } finally {
      setSavingSections((prev) => ({ ...prev, reset: false }));
    }
  }

  async function handleClearQuotes() {
    if (!confirm('Are you sure you want to clear all quote requests? This cannot be undone.')) return;
    try {
      // Clear the server-side data file
      const res = await fetch('/api/admin/quotes', { method: 'DELETE' });
      if (res.ok) {
        toast.success('All quote requests cleared');
      } else {
        // Fallback: clear localStorage
        localStorage.removeItem('quote_requests');
        toast.success('Quote requests cleared from local storage');
      }
    } catch {
      localStorage.removeItem('quote_requests');
      toast.success('Quote requests cleared from local storage');
    }
  }

  async function handleClearContacts() {
    if (!confirm('Are you sure you want to clear all contact submissions? This cannot be undone.')) return;
    try {
      const res = await fetch('/api/admin/contacts', { method: 'DELETE' });
      if (res.ok) {
        toast.success('All contact submissions cleared');
      } else {
        localStorage.removeItem('contact_submissions');
        toast.success('Contact submissions cleared from local storage');
      }
    } catch {
      localStorage.removeItem('contact_submissions');
      toast.success('Contact submissions cleared from local storage');
    }
  }

  /* -- Loading State -- */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-gray-700 border-t-amber-500 rounded-full animate-spin" />
          <span className="text-sm text-gray-500">Loading settings...</span>
        </div>
      </div>
    );
  }

  /* -- Section key groups -- */
  const companyKeys = [
    'company.name',
    'company.tagline',
    'company.email',
    'company.phone',
    'company.address.street',
    'company.address.city',
    'company.address.state',
    'company.address.zip',
    'company.website',
  ];

  const orderKeys = [
    'order.minimumQuantity',
    'order.defaultLeadTime',
    'order.taxRate',
    'order.defaultSetupFee',
    'order.wholesaleDiscount',
    'order.distributorDiscount',
  ];

  const seoKeys = ['seo.metaTitle', 'seo.metaDescription', 'seo.ogImageUrl'];

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <Settings className="w-5 h-5 text-amber-500" />
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        </div>
        <p className="text-sm text-gray-500">
          Manage your store configuration, integrations, and preferences
        </p>
      </div>

      <div className="space-y-6">
        {/* ─────────────────── Company Information ─────────────────── */}
        <Section
          icon={Building2}
          title="Company Information"
          description="Your business identity and contact details"
          onSave={() => saveSection('Company info', companyKeys)}
          saving={savingSections['Company info']}
          saveLabel="Save Company Info"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field
              label="Company Name"
              value={settings['company.name']}
              onChange={(v) => update('company.name', v)}
            />
            <Field
              label="Tagline"
              value={settings['company.tagline']}
              onChange={(v) => update('company.tagline', v)}
              placeholder="Your company tagline"
            />
            <Field
              label="Contact Email"
              value={settings['company.email']}
              onChange={(v) => update('company.email', v)}
              type="email"
            />
            <Field
              label="Phone"
              value={settings['company.phone']}
              onChange={(v) => update('company.phone', v)}
              type="tel"
            />
          </div>
          <Field
            label="Street Address"
            value={settings['company.address.street']}
            onChange={(v) => update('company.address.street', v)}
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field
              label="City"
              value={settings['company.address.city']}
              onChange={(v) => update('company.address.city', v)}
            />
            <Field
              label="State"
              value={settings['company.address.state']}
              onChange={(v) => update('company.address.state', v)}
            />
            <Field
              label="ZIP Code"
              value={settings['company.address.zip']}
              onChange={(v) => update('company.address.zip', v)}
            />
          </div>
          <Field
            label="Website URL"
            value={settings['company.website']}
            onChange={(v) => update('company.website', v)}
            type="url"
            placeholder="https://example.com"
          />
        </Section>

        {/* ─────────────────── Order Settings ─────────────────── */}
        <Section
          icon={DollarSign}
          title="Order & Pricing Rules"
          description="Configure order defaults and pricing tiers"
          onSave={() => saveSection('Order settings', orderKeys)}
          saving={savingSections['Order settings']}
          saveLabel="Save Order Settings"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field
              label="Minimum Order Quantity"
              value={settings['order.minimumQuantity']}
              onChange={(v) => update('order.minimumQuantity', v)}
              type="number"
              hint="Minimum units per order"
            />
            <Field
              label="Default Lead Time"
              value={settings['order.defaultLeadTime']}
              onChange={(v) => update('order.defaultLeadTime', v)}
              type="number"
              suffix="days"
              hint="Business days to fulfill"
            />
            <Field
              label="Tax Rate"
              value={settings['order.taxRate']}
              onChange={(v) => update('order.taxRate', v)}
              type="number"
              suffix="%"
              hint="Applied at checkout (0 = no tax)"
            />
            <Field
              label="Default Setup Fee"
              value={settings['order.defaultSetupFee']}
              onChange={(v) => update('order.defaultSetupFee', v)}
              type="number"
              prefix="$"
              hint="One-time fee per order"
            />
            <Field
              label="Wholesale Discount"
              value={settings['order.wholesaleDiscount']}
              onChange={(v) => update('order.wholesaleDiscount', v)}
              type="number"
              suffix="%"
              hint="Discount for wholesale accounts"
            />
            <Field
              label="Distributor Discount"
              value={settings['order.distributorDiscount']}
              onChange={(v) => update('order.distributorDiscount', v)}
              type="number"
              suffix="%"
              hint="Discount for approved distributors"
            />
          </div>
        </Section>

        {/* ─────────────────── Email Settings ─────────────────── */}
        <Section
          icon={Mail}
          title="Email Configuration"
          description="SMTP settings are read from environment variables"
          badge={
            <StatusPill connected={!!(envData['env.smtpHost'] && envData['env.smtpUser'])} />
          }
        >
          <div className="flex items-start gap-2 bg-blue-500/10 border border-blue-500/20 rounded-lg px-4 py-3 mb-2">
            <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-300">
              Email settings are configured via environment variables in{' '}
              <code className="font-mono text-xs bg-blue-500/20 px-1.5 py-0.5 rounded">.env.local</code>
              . They cannot be changed from this panel for security.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ReadOnlyEnvField
              label="SMTP Host"
              value={String(envData['env.smtpHost'] || '')}
              envVar="SMTP_HOST"
            />
            <ReadOnlyEnvField
              label="SMTP Port"
              value={String(envData['env.smtpPort'] || '587')}
              envVar="SMTP_PORT"
            />
            <ReadOnlyEnvField
              label="From Address"
              value={String(envData['env.smtpFrom'] || '')}
              envVar="SMTP_FROM"
            />
            <ReadOnlyEnvField
              label="SMTP User"
              value={String(envData['env.smtpUser'] || '')}
              envVar="SMTP_USER"
            />
          </div>
          <ReadOnlyEnvField
            label="Notification Recipients"
            value={String(envData['env.notificationRecipients'] || '')}
            envVar="NOTIFICATION_RECIPIENTS"
          />
          <div className="flex items-start gap-2 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3">
            <Shield className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-gray-400">
              The SMTP password is stored securely in{' '}
              <code className="font-mono text-xs bg-gray-700 px-1.5 py-0.5 rounded">SMTP_PASSWORD</code>
              {' '}and is never exposed in the admin panel.
            </p>
          </div>
        </Section>

        {/* ─────────────────── Stripe Settings ─────────────────── */}
        <Section
          icon={CreditCard}
          title="Stripe Integration"
          description="Payment processing configuration"
          badge={<StatusPill connected={!!envData['env.stripeConnected']} />}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Connection Status</label>
              <div
                className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${
                  envData['env.stripeConnected']
                    ? 'bg-emerald-500/10 border-emerald-500/20'
                    : 'bg-gray-800 border-gray-700'
                }`}
              >
                {envData['env.stripeConnected'] ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-gray-500" />
                )}
                <div>
                  <p className={`text-sm font-medium ${envData['env.stripeConnected'] ? 'text-emerald-300' : 'text-gray-400'}`}>
                    {envData['env.stripeConnected']
                      ? 'Stripe is connected and ready'
                      : 'Stripe API key not configured'}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {envData['env.stripeConnected']
                      ? 'Payments can be processed'
                      : 'Set STRIPE_SECRET_KEY in .env.local'}
                  </p>
                </div>
              </div>
            </div>
            <ReadOnlyEnvField
              label="Webhook URL"
              value={String(envData['env.stripeWebhookUrl'] || '')}
              envVar="NEXT_PUBLIC_STRIPE_WEBHOOK_URL"
            />
          </div>
          <div className="flex items-start gap-2 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3">
            <Info className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-gray-400">
              Stripe keys are configured via environment variables:{' '}
              <code className="font-mono text-xs bg-gray-700 px-1.5 py-0.5 rounded">STRIPE_SECRET_KEY</code>
              {' '}and{' '}
              <code className="font-mono text-xs bg-gray-700 px-1.5 py-0.5 rounded">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code>
            </p>
          </div>
        </Section>

        {/* ─────────────────── SEO ─────────────────── */}
        <Section
          icon={Search}
          title="SEO & Meta Tags"
          description="Default metadata for search engines and social sharing"
          onSave={() => saveSection('SEO settings', seoKeys)}
          saving={savingSections['SEO settings']}
          saveLabel="Save SEO Settings"
        >
          <Field
            label="Default Meta Title"
            value={settings['seo.metaTitle']}
            onChange={(v) => update('seo.metaTitle', v)}
            hint="Shown in browser tabs and search results (50-60 characters recommended)"
          />
          <TextareaField
            label="Default Meta Description"
            value={settings['seo.metaDescription']}
            onChange={(v) => update('seo.metaDescription', v)}
            rows={3}
            hint="Shown below the title in search results (150-160 characters recommended)"
          />
          <Field
            label="OG Image URL"
            value={settings['seo.ogImageUrl']}
            onChange={(v) => update('seo.ogImageUrl', v)}
            type="url"
            placeholder="https://example.com/og-image.jpg"
            hint="Image displayed when your site is shared on social media (1200x630px recommended)"
          />
          {settings['seo.ogImageUrl'] && (
            <div className="mt-2">
              <p className="text-xs text-gray-500 mb-2">Preview:</p>
              <div className="w-full max-w-sm rounded-lg border border-gray-700 overflow-hidden bg-gray-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={settings['seo.ogImageUrl']}
                  alt="OG Image preview"
                  className="w-full h-auto object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            </div>
          )}
        </Section>

        {/* ─────────────────── Danger Zone ─────────────────── */}
        <div className="rounded-xl border-2 border-red-500/20 bg-gray-900 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-red-500/10 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-red-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-red-400">Danger Zone</h2>
              <p className="text-xs text-gray-500 mt-0.5">Destructive actions that cannot be undone</p>
            </div>
          </div>
          <div className="p-6 space-y-1">
            <div className="flex items-center justify-between py-3 border-b border-gray-800">
              <div>
                <p className="text-sm font-medium text-gray-200">Clear all quote requests</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Permanently delete all submitted quote requests
                </p>
              </div>
              <button
                onClick={handleClearQuotes}
                className="inline-flex items-center gap-1.5 px-3 py-2 border border-red-500/30 text-red-400
                  rounded-lg text-xs font-medium hover:bg-red-500/10 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear Quotes
              </button>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-800">
              <div>
                <p className="text-sm font-medium text-gray-200">Clear all contact submissions</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Permanently delete all contact form submissions
                </p>
              </div>
              <button
                onClick={handleClearContacts}
                className="inline-flex items-center gap-1.5 px-3 py-2 border border-red-500/30 text-red-400
                  rounded-lg text-xs font-medium hover:bg-red-500/10 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear Contacts
              </button>
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-gray-200">Reset all settings to defaults</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Restore every setting on this page to its original value
                </p>
              </div>
              <button
                onClick={handleResetDefaults}
                disabled={savingSections['reset']}
                className="inline-flex items-center gap-1.5 px-3 py-2 border border-red-500/30 text-red-400
                  rounded-lg text-xs font-medium hover:bg-red-500/10 transition-colors disabled:opacity-50"
              >
                {savingSections['reset'] ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RotateCcw className="w-3.5 h-3.5" />
                )}
                Reset Defaults
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
