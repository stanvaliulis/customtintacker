'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { useSpamProtection } from '@/hooks/useSpamProtection';
import { matchQuoteSize } from '@/lib/design/quote-size';
import { recoverSavedProof } from '@/lib/design/saved-proof';

const sizeOptions = [
  { value: '', label: 'Select a size' },
  { value: '8x8', label: '8" x 8"' },
  { value: '12x12', label: '12" x 12"' },
  { value: '16x16', label: '16" x 16"' },
  { value: '18x18', label: '18" x 18"' },
  { value: '24x24', label: '24" x 24"' },
  { value: 'circle-12', label: '12" Circle' },
  { value: 'circle-18', label: '18" Circle' },
  { value: 'can-shape', label: 'Can Shape' },
  { value: 'bottle-cap', label: 'Bottle Cap' },
  { value: 'custom', label: 'Custom Size/Shape' },
];

const backingOpts = [
  { value: 'standard-024', label: 'Standard (.024" Gauge)' },
  { value: 'heavy-032', label: 'Heavy Duty (.032" Gauge)' },
  { value: 'premium-040', label: 'Premium (.040" Gauge)' },
  { value: 'unsure', label: 'Not sure yet' },
];

const embossingOpts = [
  { value: '', label: 'Select an option' },
  { value: 'yes', label: 'Yes — embossed' },
  { value: 'no', label: 'No — flat / non-embossed' },
  { value: 'unsure', label: 'Not sure yet' },
];

export default function QuoteForm() {
  const searchParams = useSearchParams();
  const productParam = searchParams.get('product') ?? '';
  const sizeParam = searchParams.get('size') ?? '';
  const shapeParam = searchParams.get('shape') ?? '';
  const designIdParam = searchParams.get('designId') ?? '';

  const teamProof = searchParams.get('proof') === 'team';
  const [proofNotes, setProofNotes] = useState('');
  const [embossing, setEmbossing] = useState('');
  const [intentMissing, setIntentMissing] = useState(false);
  const [intentLoading, setIntentLoading] = useState(teamProof);
  const [intentAttempt, setIntentAttempt] = useState(0);
  useEffect(() => {
    if (!teamProof) { setIntentLoading(false); setIntentMissing(false); return; }
    let cancelled = false;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    setIntentLoading(true); setIntentMissing(false); setProofNotes(''); setEmbossing('');
    void (async () => {
      try {
        if (!/^[A-Za-z0-9_-]{1,100}$/.test(designIdParam)) throw new Error('Invalid saved design ID.');
        const response = await fetch('/api/design/load/' + encodeURIComponent(designIdParam), { signal: controller.signal, cache: 'no-store' });
        if (!response.ok) throw new Error('Saved design unavailable.');
        const intent = recoverSavedProof(await response.json(), designIdParam);
        if (!cancelled) { setProofNotes(intent.notes); setEmbossing(intent.preference); }
      } catch { if (!cancelled) setIntentMissing(true); }
      finally { clearTimeout(timeout); if (!cancelled) setIntentLoading(false); }
    })();
    return () => { cancelled = true; clearTimeout(timeout); controller.abort(); };
  }, [teamProof, designIdParam, intentAttempt]);
  const [qaOnly, setQaOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const { getSpamFields } = useSpamProtection();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setServerError(null);

    const form = e.currentTarget;
    const formData = {
      name: (form.querySelector('#q-name') as HTMLInputElement)?.value ?? '',
      email: (form.querySelector('#q-email') as HTMLInputElement)?.value ?? '',
      phone: (form.querySelector('#q-phone') as HTMLInputElement)?.value ?? '',
      company: (form.querySelector('#q-company') as HTMLInputElement)?.value ?? '',
      product: (form.querySelector('#q-product') as HTMLInputElement)?.value ?? '',
      size: (form.querySelector('#q-size') as HTMLSelectElement)?.value ?? '',
      quantity: (form.querySelector('#q-quantity') as HTMLInputElement)?.value ?? '',
      backing: (form.querySelector('#q-backing') as HTMLSelectElement)?.value ?? '',
      embossing: (form.querySelector('#q-embossing') as HTMLSelectElement)?.value ?? '',
      colors: (form.querySelector('#q-colors') as HTMLInputElement)?.value ?? '',
      notes: (form.querySelector('#q-notes') as HTMLTextAreaElement)?.value ?? '',
      designId: designIdParam || undefined,
    };

    const honeypot = (form.querySelector('#fax_number') as HTMLInputElement)?.value ?? '';
    const spamFields = getSpamFields();
    if (honeypot) spamFields._hp = honeypot;

    try {
      const res = await fetch('/api/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, ...spamFields }),
      });

      const data = await res.json();

      if (res.status === 400 && data.fieldErrors) {
        setErrors(data.fieldErrors);
        setLoading(false);
        return;
      }

      if (!res.ok) {
        setServerError(data.error || 'Something went wrong. Please try again.');
        setLoading(false);
        return;
      }

      setLoading(false);
      setQaOnly(data.qaOnly === true);
      setSubmitted(true);
      toast.success(data.qaOnly ? 'Local review fixture saved. Nothing was sent.' : 'Quote request submitted!');
    } catch {
      setServerError('Unable to reach the server. Please check your connection and try again.');
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{qaOnly ? 'Local review saved' : 'Quote Request Submitted!'}</h3>
        <p className="text-gray-600 mb-1">{qaOnly ? 'This isolated preview did not send a request or email.' : 'Thank you for your interest. Our team will review your request.'}</p>
        <p className="text-gray-500 text-sm">{!qaOnly && <>You&apos;ll hear from us within 1 business day.</>}</p>
        <button onClick={() => setSubmitted(false)} className="text-amber-600 hover:text-amber-700 text-sm mt-6">
          Submit another request
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {teamProof && <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><strong>Let us prepare your proof</strong><p>Your saved artwork and the preferences you enter below will accompany this request. The automatic preview is not approved production artwork.</p>{intentLoading && <p role="status">Loading proof preferences from your saved design…</p>}{intentMissing && <div role="alert"><p>Saved proof preferences could not be recovered. Reopen and save an older design in the editor, or enter your embossing preference and notes below. No request has been sent.</p><button type="button" className="min-h-11 underline" onClick={() => setIntentAttempt(n => n + 1)}>Retry loading saved preferences</button></div>}</div>}
      {designIdParam && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
          <div className="w-8 h-8 rounded bg-amber-100 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div>
            <p className="text-sm font-medium text-amber-800">Design attached</p>
            <p className="text-xs text-amber-600">Your design from the editor will be included with this quote request.</p>
          </div>
        </div>
      )}

      <div>
        <h3 className="font-semibold text-gray-900 mb-4">Contact Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Name" id="q-name" required placeholder="Your name" error={errors.name} />
          <Input label="Email" id="q-email" type="email" required placeholder="your@email.com" error={errors.email} />
          <Input label="Phone" id="q-phone" type="tel" placeholder="(555) 123-4567" error={errors.phone} />
          <Input label="Company" id="q-company" required placeholder="Company name" error={errors.company} />
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-gray-900 mb-4">Product Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Input
              label="Product"
              id="q-product"
              placeholder="e.g., 22&quot; Bottle Cap Tacker"
              defaultValue={productParam ? `${productParam}${shapeParam ? ` (${shapeParam})` : ''}` : ''}
              error={errors.product}
            />
          </div>
          <Select label="Size / Shape" id="q-size" required options={sizeOptions} defaultValue={sizeParam ? matchQuoteSize(sizeParam, shapeParam) : ''} error={errors.size} />
          <Input label="Quantity" id="q-quantity" type="number" required min={1} placeholder="e.g., 500" error={errors.quantity} />
          <Select label="Backing" id="q-backing" options={backingOpts} />
          <Select label="Embossing" id="q-embossing" required disabled={intentLoading} options={embossingOpts} value={embossing} onChange={e => setEmbossing(e.target.value)} error={errors.embossing} />
          <Input label="Colors" id="q-colors" placeholder="e.g., Full color, 2 spot colors" />
        </div>
      </div>

      <div>
        <label htmlFor="q-notes" className="block text-sm font-medium text-gray-700 mb-1">
          Additional Notes
        </label>
        <textarea
          id="q-notes" disabled={intentLoading} value={proofNotes} onChange={e => setProofNotes(e.target.value)}
          rows={4}
          placeholder="Tell us about your project — custom shapes, special finishes, delivery timeline, etc."
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-colors"
        />
      </div>

      {serverError && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-red-700">{serverError}</p>
        </div>
      )}

      {/* Honeypot — invisible to humans */}
      <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', top: '-9999px', opacity: 0, height: 0, overflow: 'hidden' }}>
        <label htmlFor="fax_number">Fax</label>
        <input type="text" id="fax_number" name="fax_number" tabIndex={-1} autoComplete="off" />
      </div>

      <Button type="submit" disabled={intentLoading} loading={loading} size="lg">Submit Quote Request</Button>
    </form>
  );
}
