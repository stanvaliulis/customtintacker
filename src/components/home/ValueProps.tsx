import Container from '@/components/ui/Container';
import { Flag, Recycle, Palette, Clock, Shield, Layers } from 'lucide-react';

const differentiators = [
  {
    icon: Flag,
    title: 'Made in the USA',
    description: 'Every sign is manufactured in our facility in Machesney Park, Illinois.',
  },
  {
    icon: Recycle,
    title: 'Recycled aluminum',
    description: 'Embossed on .024 gauge recycled aluminum. Built to last indoors and out.',
  },
  {
    icon: Palette,
    title: 'Full-color printing',
    description: 'Vibrant 4-color process digital print — no limits on colors or gradients.',
  },
  {
    icon: Clock,
    title: '15 business days',
    description: 'Most orders ship in about 15 business days from artwork approval.',
  },
  {
    icon: Layers,
    title: '100+ products',
    description: 'Squares, circles, cans, bottle caps, state shapes, vinyl, and custom die-cuts.',
  },
  {
    icon: Shield,
    title: 'Free proofs',
    description: 'We send a digital proof before production. No surprises, no extra charge.',
  },
];

export default function ValueProps() {
  return (
    <section className="py-20 sm:py-24 bg-gray-50">
      <Container>
        <div className="mb-14 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            Why Custom Tin Tackers
          </h2>
          <p className="mt-3 text-lg text-gray-500 max-w-xl mx-auto">
            Factory-direct from our shop in Illinois. No middlemen, no markup on markup.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {differentiators.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="flex gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 shrink-0">
                  <Icon className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-1">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
