import Container from '@/components/ui/Container';

const steps = [
  {
    number: '1',
    title: 'Send us your artwork',
    description: 'Email us your logo or design files. We\'ll handle the rest — setup, proofs, all of it.',
  },
  {
    number: '2',
    title: 'We make your signs',
    description: 'Embossed on recycled aluminum, printed in full color, right here in the USA.',
  },
  {
    number: '3',
    title: 'They show up at your door',
    description: 'Boxed up and shipped. Most orders are done in about 15 business days.',
  },
];

export default function ValueProps() {
  return (
    <section className="py-20 sm:py-28 bg-gray-50">
      <Container>
        <div className="mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            How it works
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-12 sm:gap-8 lg:gap-16">
          {steps.map((step) => (
            <div key={step.number}>
              <span className="text-4xl font-extrabold text-amber-500 mb-3 block">
                {step.number}.
              </span>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {step.title}
              </h3>
              <p className="text-gray-500 leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
