import Link from 'next/link';
import Container from '@/components/ui/Container';

export default function NotFound() {
  return (
    <section className="py-20 sm:py-28">
      <Container>
        <div className="max-w-xl mx-auto text-center">
          <p className="text-7xl font-bold text-amber-600 mb-4">404</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Page Not Found
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Looks like this page doesn&apos;t exist. It may have been moved or the
            link might be outdated. Either way, let&apos;s get you back on track.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 transition-colors"
            >
              Back to Homepage
            </Link>
            <Link
              href="/products"
              className="inline-flex items-center justify-center px-6 py-3 bg-white text-gray-900 font-semibold rounded-lg border border-gray-300 hover:border-gray-400 transition-colors"
            >
              Browse Products
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
