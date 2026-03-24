'use client';

import { useState, useEffect, useRef } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { toast } from 'sonner';
import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Lock } from 'lucide-react';

export default function WholesaleLoginPage() {
  const { data: session, status } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const redirectedRef = useRef(false);

  // Redirect if already logged in
  useEffect(() => {
    if (status === 'authenticated' && session?.user && !redirectedRef.current) {
      redirectedRef.current = true;
      window.location.href = '/products';
    }
  }, [session, status]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email: email.trim().toLowerCase(),
        password: password.trim(),
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password.');
        setLoading(false);
      } else if (result?.ok) {
        toast.success('Welcome back! Distributor pricing is now active.');
        window.location.href = '/products';
        // Keep loading=true since we're navigating away
      } else {
        setError('Something went wrong. Please try again.');
        setLoading(false);
      }
    } catch {
      setError('Unable to connect. Please try again.');
      setLoading(false);
    }
  }

  // If session status is loading for more than 5 seconds, show the form anyway
  const [sessionTimeout, setSessionTimeout] = useState(false);
  useEffect(() => {
    if (status === 'loading') {
      const timer = setTimeout(() => setSessionTimeout(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  // Show loading state while checking session (with timeout fallback)
  if (status === 'loading' && !sessionTimeout) {
    return (
      <section className="py-16 sm:py-24">
        <Container>
          <div className="max-w-sm mx-auto text-center">
            <div className="animate-spin w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Checking session...</p>
          </div>
        </Container>
      </section>
    );
  }

  // If already authenticated, show a brief redirect message
  if (status === 'authenticated' && session?.user) {
    return (
      <section className="py-16 sm:py-24">
        <Container>
          <div className="max-w-sm mx-auto text-center">
            <p className="text-gray-500 text-sm">Redirecting to products...</p>
          </div>
        </Container>
      </section>
    );
  }

  return (
    <section className="py-16 sm:py-24">
      <Container>
        <div className="max-w-sm mx-auto">
          <div className="text-center mb-8">
            <div className="mx-auto w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center mb-4">
              <Lock className="w-7 h-7 text-gray-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Distributor Login</h1>
            <p className="text-gray-500 text-sm mt-2">
              Sign in to see your distributor pricing across the site.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <Input
              label="Email"
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              autoComplete="email"
              disabled={loading}
            />
            <Input
              label="Password"
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoComplete="current-password"
              disabled={loading}
            />

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <Button type="submit" loading={loading} size="lg" className="w-full">
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-6">
            Distributor accounts are created when your application is approved.{' '}
            <a href="/distributors/apply" className="text-amber-600 hover:underline">Apply here</a>.
          </p>
        </div>
      </Container>
    </section>
  );
}
