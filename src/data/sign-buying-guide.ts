import { manufacturingFacts } from './manufacturing-facts';

// Editorial intent mapping, not a list of keyword landing pages or availability promises.
export const signBuyingGuide = [
  { title: 'Custom embossed metal signs', text: 'Embossing raises selected areas of the metal surface. Choose embossed aluminum signs when you want that raised detail; a printed highlight or shadow is not physical embossing. Flat metal and vinyl signs are separate constructions.', href: '/blog/what-is-a-tin-tacker-sign', link: 'Understand tin tackers and embossing' },
  { title: 'Custom brewery signs and metal beer signs', text: 'Start with the artwork: a round brewery seal suits a circle, a can label suits a can shape, and a bottle-cap outline suggests a bottled-beer display. Compare finished dimensions against the space in your taproom before choosing.', href: '/brewery-signs', link: 'Compare brewery sign formats' },
  { title: 'Promotional metal signs and branded bar signs', text: 'For bar walls, retail displays or account promotions, decide where the sign will hang and how many locations need one. Keep the logo and key message readable at the intended viewing distance; check each product for quantity tiers.', href: '/bar-signs', link: 'Plan branded bar signage' },
  { title: 'Custom die-cut metal signs', text: 'A custom outline follows a logo or other artwork instead of a standard circle or rectangle. Send the proposed outline, finished size and quantity for review. The team must confirm cutting, holes and any requested embossing before production.', href: '/products/custom-shape-tacker', link: 'Request a custom-shape sign' },
  { title: 'Custom bottle cap signs', text: 'Bottle-cap describes the outline, not a guarantee of raised artwork. The listed 22-inch bottle cap tacker is flat, not embossed. Check its finished size and construction before choosing it for your brewery or bar.', href: '/products/22-inch-bottle-cap-tacker', link: 'See the flat 22-inch bottle cap sign' },
] as const;

export const aluminumBuyingAnswer = `Our aluminum signs use ${manufacturingFacts.material} with direct print. White on both sides describes the material finish, not two-sided artwork printing. ${manufacturingFacts.timing} Transit time is additional. Check the selected product for flat or embossed construction.`;
