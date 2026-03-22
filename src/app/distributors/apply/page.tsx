'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import Container from '@/components/ui/Container';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import { CheckCircle, ArrowLeft } from 'lucide-react';

const volumeOptions = [
  { value: '', label: 'Select estimated volume...' },
  { value: 'under-100', label: 'Under 100 units/month' },
  { value: '100-500', label: '100 - 500 units/month' },
  { value: '500-1000', label: '500 - 1,000 units/month' },
  { value: '1000-5000', label: '1,000 - 5,000 units/month' },
  { value: '5000+', label: '5,000+ units/month' },
];

const industryOptions = [
  { value: '', label: 'Select primary industry...' },
  { value: 'beverage', label: 'Beverage' },
  { value: 'cannabis', label: 'Cannabis' },
  { value: 'food-restaurant', label: 'Food & Restaurant' },
  { value: 'corporate', label: 'Corporate' },
  { value: 'sports-entertainment', label: 'Sports & Entertainment' },
  { value: 'other', label: 'Other' },
];

interface FormData {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  website: string;
  asiNumber: string;
  sageNumber: string;
  ppaiNumber: string;
  monthlyVolume: string;
  primaryIndustry: string;
  hearAboutUs: string;
  additionalNotes: string;
  agreeTerms: boolean;
}

const initialFormData: FormData = {
  companyName: '',
  contactName: '',
  email: '',
  phone: '',
  website: '',
  asiNumber: '',
  sageNumber: '',
  ppaiNumber: '',
  monthlyVolume: '',
  primaryIndustry: '',
  hearAboutUs: '',
  additionalNotes: '',
  agreeTerms: false,
};

export default function DistributorApplyPage() {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  function updateField(field: keyof FormData, value: string | boolean) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user types
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  function validate(): boolean {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.companyName.trim()) newErrors.companyName = 'Company name is required.';
    if (!formData.contactName.trim()) newErrors.contactName = 'Contact name is required.';
    if (!formData.email.trim()) newErrors.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = 'Please enter a valid email address.';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required.';
    if (!formData.monthlyVolume) newErrors.monthlyVolume = 'Please select an estimated volume.';
    if (!formData.primaryIndustry) newErrors.primaryIndustry = 'Please select a primary industry.';

    // At least one of ASI / SAGE / PPAI
    if (!formData.asiNumber.trim() && !formData.sageNumber.trim() && !formData.ppaiNumber.trim()) {
      newErrors.asiNumber = 'At least one membership number is required.';
    }

    if (!formData.agreeTerms) {
      newErrors.agreeTerms = 'You must agree to the terms and conditions.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setServerError(null);

    try {
      const res = await fetch('/api/distributors/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.status === 400 && data.fieldErrors) {
        setErrors(data.fieldErrors);
        setSubmitting(false);
        return;
      }

      if (!res.ok) {
        setServerError(data.error || 'Something went wrong. Please try again.');
        setSubmitting(false);
        return;
      }

      setSubmitting(false);
      setSubmitted(true);
    } catch {
      setServerError('Unable to reach the server. Please check your connection and try again.');
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <section className="py-16 sm:py-24">
        <Container>
          <div className="max-w-xl mx-auto text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Application Submitted</h1>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Thank you for applying to our distributor program. Our team will review your
              application and get back to you within 1 business day. Keep an eye on your
              inbox for next steps.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/distributors">
                <Button variant="outline">Back to Distributor Program</Button>
              </Link>
              <Link href="/products">
                <Button>Browse Products</Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>
    );
  }

  return (
    <section className="py-12 sm:py-16">
      <Container>
        <div className="max-w-2xl mx-auto">
          {/* Back link */}
          <Link
            href="/distributors"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Distributor Program
          </Link>

          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Distributor Application
            </h1>
            <p className="text-lg text-gray-600">
              Complete the form below to apply for our distributor program. We review
              applications within 1 business day.
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              {/* Company Info */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    id="companyName"
                    label="Company Name"
                    required
                    value={formData.companyName}
                    onChange={(e) => updateField('companyName', e.target.value)}
                    error={errors.companyName}
                    placeholder="Your Company Inc."
                  />
                  <Input
                    id="contactName"
                    label="Contact Name"
                    required
                    value={formData.contactName}
                    onChange={(e) => updateField('contactName', e.target.value)}
                    error={errors.contactName}
                    placeholder="John Doe"
                  />
                  <Input
                    id="email"
                    label="Email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    error={errors.email}
                    placeholder="john@company.com"
                  />
                  <Input
                    id="phone"
                    label="Phone"
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    error={errors.phone}
                    placeholder="(555) 123-4567"
                  />
                  <div className="sm:col-span-2">
                    <Input
                      id="website"
                      label="Website URL"
                      type="url"
                      value={formData.website}
                      onChange={(e) => updateField('website', e.target.value)}
                      placeholder="https://www.yourcompany.com"
                    />
                  </div>
                </div>
              </div>

              {/* Membership Numbers */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Membership Numbers</h2>
                <p className="text-sm text-gray-500 mb-4">
                  At least one ASI, SAGE, or PPAI number is required to qualify for distributor pricing.
                </p>
                {errors.asiNumber && (
                  <p className="text-sm text-red-600 mb-3">{errors.asiNumber}</p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input
                    id="asiNumber"
                    label="ASI Number"
                    value={formData.asiNumber}
                    onChange={(e) => updateField('asiNumber', e.target.value)}
                    placeholder="e.g. 12345"
                  />
                  <Input
                    id="sageNumber"
                    label="SAGE Number"
                    value={formData.sageNumber}
                    onChange={(e) => updateField('sageNumber', e.target.value)}
                    placeholder="e.g. 67890"
                  />
                  <Input
                    id="ppaiNumber"
                    label="PPAI Number"
                    value={formData.ppaiNumber}
                    onChange={(e) => updateField('ppaiNumber', e.target.value)}
                    placeholder="e.g. 112233"
                  />
                </div>
              </div>

              {/* Business Details */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Business Details</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    id="monthlyVolume"
                    label="Estimated Monthly Volume"
                    required
                    options={volumeOptions}
                    value={formData.monthlyVolume}
                    onChange={(e) => updateField('monthlyVolume', e.target.value)}
                    error={errors.monthlyVolume}
                  />
                  <Select
                    id="primaryIndustry"
                    label="Primary Industry Served"
                    required
                    options={industryOptions}
                    value={formData.primaryIndustry}
                    onChange={(e) => updateField('primaryIndustry', e.target.value)}
                    error={errors.primaryIndustry}
                  />
                  <div className="sm:col-span-2">
                    <Input
                      id="hearAboutUs"
                      label="How did you hear about us?"
                      value={formData.hearAboutUs}
                      onChange={(e) => updateField('hearAboutUs', e.target.value)}
                      placeholder="Trade show, referral, online search, etc."
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="additionalNotes"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Additional Notes
                    </label>
                    <textarea
                      id="additionalNotes"
                      rows={4}
                      value={formData.additionalNotes}
                      onChange={(e) => updateField('additionalNotes', e.target.value)}
                      placeholder="Tell us about your business, typical client projects, or any questions you have..."
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-colors resize-vertical"
                    />
                  </div>
                </div>
              </div>

              {/* Terms */}
              <div>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.agreeTerms}
                    onChange={(e) => updateField('agreeTerms', e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-sm text-gray-600">
                    I agree to the{' '}
                    <span className="text-amber-600 font-medium underline">
                      distributor terms and conditions
                    </span>
                    . I certify that I am an authorized representative of the company listed above
                    and that the membership numbers provided are accurate.
                  </span>
                </label>
                {errors.agreeTerms && (
                  <p className="text-sm text-red-600 mt-1 ml-7">{errors.agreeTerms}</p>
                )}
              </div>

              {/* Server Error */}
              {serverError && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                  <p className="text-sm text-red-700">{serverError}</p>
                </div>
              )}

              {/* Submit */}
              <Button type="submit" size="lg" className="w-full" loading={submitting}>
                {submitting ? 'Submitting Application...' : 'Submit Application'}
              </Button>
            </form>
          </div>

          {/* Help text */}
          <p className="text-center text-sm text-gray-500 mt-6">
            Have questions before applying?{' '}
            <Link href="/contact" className="text-amber-600 hover:text-amber-700 font-medium">
              Contact our sales team
            </Link>{' '}
            and we will be happy to help.
          </p>
        </div>
      </Container>
    </section>
  );
}
