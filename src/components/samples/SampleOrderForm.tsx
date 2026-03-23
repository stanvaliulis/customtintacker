'use client';

import { useState, FormEvent } from 'react';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

const SAMPLE_PACKS = [
  { id: 'basic', label: 'Basic Sample ($15)', price: 15 },
  { id: 'variety', label: 'Variety Pack ($35)', price: 35 },
  { id: 'custom', label: 'Custom Sample ($25)', price: 25 },
] as const;

interface FormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  samplePack: string;
  shippingAddress: string;
  city: string;
  state: string;
  zip: string;
  notes: string;
}

const initial: FormData = {
  name: '',
  email: '',
  phone: '',
  company: '',
  samplePack: 'basic',
  shippingAddress: '',
  city: '',
  state: '',
  zip: '',
  notes: '',
};

export default function SampleOrderForm() {
  const [form, setForm] = useState<FormData>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [serverError, setServerError] = useState('');

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validate(): boolean {
    const e: Partial<Record<keyof FormData, string>> = {};
    if (!form.name.trim()) e.name = 'Name is required.';
    if (!form.email.trim()) e.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = 'Enter a valid email.';
    if (!form.samplePack) e.samplePack = 'Choose a sample pack.';
    if (!form.shippingAddress.trim())
      e.shippingAddress = 'Shipping address is required.';
    if (!form.city.trim()) e.city = 'City is required.';
    if (!form.state.trim()) e.state = 'State is required.';
    if (!form.zip.trim()) e.zip = 'ZIP code is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    setStatus('submitting');
    setServerError('');

    try {
      const res = await fetch('/api/samples', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.fieldErrors) {
          setErrors(data.fieldErrors);
          setStatus('idle');
        } else {
          setServerError(data.error || 'Something went wrong.');
          setStatus('error');
        }
        return;
      }
      setStatus('success');
    } catch {
      setServerError('Network error. Please try again.');
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div className="text-center py-12 px-6 bg-gray-900/60 border border-gray-800/50 rounded-2xl">
        <CheckCircle2 className="w-14 h-14 text-green-400 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-white">Order Received!</h3>
        <p className="mt-2 text-gray-400 max-w-md mx-auto">
          We&apos;ll get your sample pack made and shipped within 5-7 business
          days. Keep an eye on your inbox for a confirmation and tracking info.
        </p>
      </div>
    );
  }

  const inputCls =
    'w-full rounded-lg bg-gray-800/60 border border-gray-700/50 text-white placeholder-gray-500 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-colors';
  const labelCls = 'block text-sm font-medium text-gray-300 mb-1.5';
  const errorCls = 'text-xs text-red-400 mt-1';

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {/* Name / Email row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className={labelCls}>
            Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="John Smith"
            className={inputCls}
          />
          {errors.name && <p className={errorCls}>{errors.name}</p>}
        </div>
        <div>
          <label className={labelCls}>
            Email <span className="text-red-400">*</span>
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            placeholder="john@brewery.com"
            className={inputCls}
          />
          {errors.email && <p className={errorCls}>{errors.email}</p>}
        </div>
      </div>

      {/* Phone / Company */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className={labelCls}>Phone</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => set('phone', e.target.value)}
            placeholder="(555) 123-4567"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Company</label>
          <input
            type="text"
            value={form.company}
            onChange={(e) => set('company', e.target.value)}
            placeholder="Your brewery or business"
            className={inputCls}
          />
        </div>
      </div>

      {/* Sample Pack selection */}
      <div>
        <label className={labelCls}>
          Sample Pack <span className="text-red-400">*</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {SAMPLE_PACKS.map((pack) => (
            <button
              type="button"
              key={pack.id}
              onClick={() => set('samplePack', pack.id)}
              className={`px-4 py-3 rounded-lg border text-sm font-medium transition-all text-left ${
                form.samplePack === pack.id
                  ? 'bg-amber-500/10 border-amber-500/50 text-amber-400'
                  : 'bg-gray-800/40 border-gray-700/50 text-gray-400 hover:border-gray-600'
              }`}
            >
              {pack.label}
            </button>
          ))}
        </div>
        {errors.samplePack && <p className={errorCls}>{errors.samplePack}</p>}
      </div>

      {/* Shipping address */}
      <div>
        <label className={labelCls}>
          Shipping Address <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={form.shippingAddress}
          onChange={(e) => set('shippingAddress', e.target.value)}
          placeholder="123 Main Street, Suite 4"
          className={inputCls}
        />
        {errors.shippingAddress && (
          <p className={errorCls}>{errors.shippingAddress}</p>
        )}
      </div>

      {/* City / State / ZIP */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="col-span-2 sm:col-span-2">
          <label className={labelCls}>
            City <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={form.city}
            onChange={(e) => set('city', e.target.value)}
            placeholder="Portland"
            className={inputCls}
          />
          {errors.city && <p className={errorCls}>{errors.city}</p>}
        </div>
        <div>
          <label className={labelCls}>
            State <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={form.state}
            onChange={(e) => set('state', e.target.value)}
            placeholder="OR"
            className={inputCls}
          />
          {errors.state && <p className={errorCls}>{errors.state}</p>}
        </div>
        <div>
          <label className={labelCls}>
            ZIP <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={form.zip}
            onChange={(e) => set('zip', e.target.value)}
            placeholder="97201"
            className={inputCls}
          />
          {errors.zip && <p className={errorCls}>{errors.zip}</p>}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className={labelCls}>Special Notes</label>
        <textarea
          rows={3}
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
          placeholder="Any details about your project, artwork files, or questions..."
          className={inputCls}
        />
      </div>

      {/* Server error */}
      {status === 'error' && serverError && (
        <div className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {serverError}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={status === 'submitting'}
        className="w-full inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 transition-colors text-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === 'submitting' ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Submitting...
          </>
        ) : (
          'Submit Sample Order'
        )}
      </button>

      <p className="text-xs text-gray-500 text-center">
        We&apos;ll follow up with payment details via email. No payment is
        collected on this form.
      </p>
    </form>
  );
}
