import Link from 'next/link';
import Button from '@/components/ui/Button';
import Container from '@/components/ui/Container';

export default function CTABanner() {
  return (
    <section className="bg-amber-500">
      <Container className="py-16 sm:py-20">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Let&apos;s make your sign.
          </h2>
          <Link href="/quote">
            <Button
              size="lg"
              className="bg-gray-900 text-white hover:bg-gray-800 px-10 py-4 text-lg"
            >
              Get Started
            </Button>
          </Link>
        </div>
      </Container>
    </section>
  );
}
