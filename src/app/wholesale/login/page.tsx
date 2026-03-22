'use client';

import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { toast } from 'sonner';
import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Lock } from 'lucide-react';

export default function WholesaleLoginPage() {
  const { data: session, status } = useSession();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      window.location.href = '/products';
    }
  }, [session, status]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await signIn('credentials', {
      username,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError('Invalid username or password.');
      setLoading(false);
    } else {
      toast.success('Welcome back! Distributor pricing is now active.');
      // Use hard redirect to ensure full page refresh with new session
      window.location.href = '/products';
    }
  }

  // Show loading state while checking session
  if (status === 'loading') {
    return (
      <section className="py-16 sm:py-24">
        <Container>
          <div className="max-w-sm mx-auto text-center">
            <p className="text-gray-500">Loading...</p>
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
              id="username"
              type="email"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="your@email.com"
            />
            <Input
              label="Password"
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
            />

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button type="submit" loading={loading} size="lg" className="w-full">
              Sign In
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
