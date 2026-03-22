'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';

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

export default function QuoteForm() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);

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
      size: (form.querySelector('#q-size') as HTMLSelectElement)?.value ?? '',
      quantity: (form.querySelector('#q-quantity') as HTMLInputElement)?.value ?? '',
      backing: (form.querySelector('#q-backing') as HTMLSelectElement)?.value ?? '',
      colors: (form.querySelector('#q-colors') as HTMLInputElement)?.value ?? '',
      notes: (form.querySelector('#q-notes') as HTMLTextAreaElement)?.value ?? '',
    };

    try {
      const res = await fetch('/api/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
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
      setSubmitted(true);
      toast.success('Quote request submitted!');
    } catch {
      setServerError('Unable to reach the server. Please check your connection and try again.');
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Quote Request Submitted!</h3>
        <p className="text-gray-600 mb-1">Thank you for your interest. Our team will review your request.</p>
        <p className="text-gray-500 text-sm">You&apos;ll hear from us within 1 business day.</p>
        <button onClick={() => setSubmitted(false)} className="text-amber-600 hover:text-amber-700 text-sm mt-6">
          Submit another request
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
          <Select label="Size / Shape" id="q-size" required options={sizeOptions} error={errors.size} />
          <Input label="Quantity" id="q-quantity" type="number" required min={1} placeholder="e.g., 500" error={errors.quantity} />
          <Select label="Backing" id="q-backing" options={backingOpts} />
          <Input label="Colors" id="q-colors" placeholder="e.g., Full color, 2 spot colors" />
        </div>
      </div>

      <div>
        <label htmlFor="q-notes" className="block text-sm font-medium text-gray-700 mb-1">
          Additional Notes
        </label>
        <textarea
          id="q-notes"
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

      <Button type="submit" loading={loading} size="lg">Submit Quote Request</Button>
    </form>
  );
}
