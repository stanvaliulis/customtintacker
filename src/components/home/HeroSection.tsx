import Link from 'next/link';
import Button from '@/components/ui/Button';
import Container from '@/components/ui/Container';
import Logo from '@/components/ui/Logo';

export default function HeroSection() {
  return (
    <section
      className="relative bg-gray-950 text-white overflow-hidden min-h-[90vh] flex flex-col justify-center bg-cover bg-center"
      style={{ backgroundImage: 'url(/images/hero/tin-tackers-collage.jpg)' }}
    >
      {/* Dark overlay gradient — heavier on left/bottom for text readability, lighter on right to show photo */}
      <div className="absolute inset-0 bg-gradient-to-r from-gray-950/95 via-gray-950/70 to-gray-950/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-gray-950/90 via-gray-950/30 to-transparent" />

      <Container className="relative py-24 sm:py-32 lg:py-40">
        <div className="max-w-3xl">
          {/* Brand logo */}
          <div className="mb-8">
            <Logo size="xl" variant="light" />
          </div>

          {/* Main headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05]">
            We Make Tin Tackers.
          </h1>

          {/* Subtext */}
          <p className="mt-8 text-lg sm:text-xl text-gray-300 max-w-2xl leading-relaxed">
            The signs you see in every brewery and bar? We make those.
            Custom shapes, your artwork, shipped in about 15 business days.
          </p>

          {/* CTAs */}
          <div className="mt-12 flex flex-wrap gap-5">
            <Link href="/products">
              <Button
                size="lg"
                className="bg-amber-500 hover:bg-amber-600 text-white shadow-lg px-10 py-4 text-lg"
              >
                See Our Signs
              </Button>
            </Link>
            <Link href="/quote">
              <Button
                variant="outline"
                size="lg"
                className="border-2 border-white/30 text-white hover:bg-white/10 hover:border-white/50 backdrop-blur-sm px-10 py-4 text-lg"
              >
                Get a Quote
              </Button>
            </Link>
          </div>
        </div>

        {/* Trust badges — simple text row */}
        <div className="mt-20 pt-10 border-t border-white/10">
          <p className="text-sm sm:text-base text-gray-400 tracking-wide">
            Made in USA &bull; 25 minimum &bull; Full color &bull; ~15 business days
          </p>
        </div>
      </Container>
    </section>
  );
}
