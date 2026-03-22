import Link from 'next/link';
import Container from '@/components/ui/Container';

export default function DistributorBanner() {
  return (
    <section className="py-8 sm:py-10 bg-gray-100 border-t border-gray-200">
      <Container>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-gray-700 text-base sm:text-lg">
            <span className="font-semibold">ASI / SAGE / PPAI distributors</span> — we&apos;ve got you.
            Competitive pricing, dropship, the whole deal.
          </p>
          <Link
            href="/distributors"
            className="text-amber-600 hover:text-amber-700 font-semibold whitespace-nowrap"
          >
            Learn more &rarr;
          </Link>
        </div>
      </Container>
    </section>
  );
}
