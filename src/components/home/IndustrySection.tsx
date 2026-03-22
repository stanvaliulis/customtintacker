import Container from '@/components/ui/Container';

const industries = [
  'Breweries',
  'Distilleries',
  'Coffee shops',
  'Restaurants',
  'Cannabis brands',
  'Sports venues',
  'Wineries',
  'Food trucks',
  'Hotels',
  'Retail shops',
];

export default function IndustrySection() {
  return (
    <section className="py-16 sm:py-20 bg-white">
      <Container>
        <div className="max-w-3xl">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
            Not just for breweries
          </h2>
          <p className="text-lg text-gray-600 leading-relaxed mb-8">
            Yeah, breweries are our bread and butter. But we also make signs for
            distilleries, coffee shops, restaurants, cannabis brands, sports
            venues — basically anyone who wants a badass sign on their wall.
          </p>
          <div className="flex flex-wrap gap-2">
            {industries.map((industry) => (
              <span
                key={industry}
                className="px-4 py-1.5 rounded-full bg-gray-100 text-gray-700 text-sm font-medium"
              >
                {industry}
              </span>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
