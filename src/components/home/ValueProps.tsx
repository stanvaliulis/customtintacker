import Container from '@/components/ui/Container';
import { Upload, Factory, Truck } from 'lucide-react';

const steps = [
  {
    number: '1',
    title: 'Send us your artwork',
    description: 'Email us your logo or design files. We\'ll handle the rest — setup, proofs, all of it.',
    icon: Upload,
  },
  {
    number: '2',
    title: 'We make your signs',
    description: 'Embossed on recycled aluminum, printed in full color, right here in the USA.',
    icon: Factory,
  },
  {
    number: '3',
    title: 'They show up at your door',
    description: 'Boxed up and shipped. Most orders are done in about 15 business days.',
    icon: Truck,
  },
];

export default function ValueProps() {
  return (
    <section className="py-20 sm:py-28 bg-gray-50">
      <Container>
        <div className="mb-14 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            How it works
          </h2>
          <p className="mt-3 text-lg text-gray-500">Three steps. No hassle.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-12 sm:gap-8 lg:gap-16">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.number} className="text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-4 mb-4">
                  <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                    <Icon className="w-6 h-6 text-amber-600" />
                  </div>
                  <span className="text-4xl font-extrabold text-amber-500">
                    {step.number}.
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-500 leading-relaxed">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
