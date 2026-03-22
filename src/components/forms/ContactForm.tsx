'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function ContactForm() {
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
      name: (form.querySelector('#name') as HTMLInputElement)?.value ?? '',
      email: (form.querySelector('#email') as HTMLInputElement)?.value ?? '',
      phone: (form.querySelector('#phone') as HTMLInputElement)?.value ?? '',
      company: (form.querySelector('#company') as HTMLInputElement)?.value ?? '',
      message: (form.querySelector('#message') as HTMLTextAreaElement)?.value ?? '',
    };

    try {
      const res = await fetch('/api/contact', {
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
      toast.success('Message sent! We\'ll get back to you soon.');
    } catch {
      setServerError('Unable to reach the server. Please check your connection and try again.');
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Message Sent!</h3>
        <p className="text-gray-600">We&apos;ll get back to you within 1 business day.</p>
        <button onClick={() => setSubmitted(false)} className="text-amber-600 hover:text-amber-700 text-sm mt-4">
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Name" id="name" required placeholder="Your name" error={errors.name} />
        <Input label="Email" id="email" type="email" required placeholder="your@email.com" error={errors.email} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Phone" id="phone" type="tel" placeholder="(555) 123-4567" error={errors.phone} />
        <Input label="Company" id="company" placeholder="Company name" error={errors.company} />
      </div>
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
          Message <span className="text-red-500">*</span>
        </label>
        <textarea
          id="message"
          required
          rows={5}
          placeholder="How can we help?"
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-colors"
        />
        {errors.message && <p className="text-sm text-red-600 mt-1">{errors.message}</p>}
      </div>

      {serverError && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-red-700">{serverError}</p>
        </div>
      )}

      <Button type="submit" loading={loading} size="lg">Send Message</Button>
    </form>
  );
}
