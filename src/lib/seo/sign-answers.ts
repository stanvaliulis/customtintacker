import { manufacturingFacts } from '@/data/manufacturing-facts';
/** Fact-safe explanations only. Manufacturing and commercial policies remain product-specific. */
export const signAnswers=[
 {question:'What are tin tackers?',answer:'Tin tackers are branded signs commonly displayed in breweries, bars and shops. Embossed metal versions combine printed artwork with raised areas that give the surface depth and texture. Check each product’s specifications for material, finished size and whether it is embossed or flat.'},
 {question:'Is an artwork preview an approved production proof?',answer:'No. Embossing suggestions are not approved tooling or a production proof. The team must confirm the final cut, holes, artwork quality and embossing feasibility. Confirming a direction in the upload preview does not submit an order or send a team request.'},
 { question: 'How long do aluminum tin tackers take?', answer: manufacturingFacts.timing },
{ question: 'How are your aluminum signs printed?', answer: 'We direct print on ' + manufacturingFacts.material + '. White on both sides describes the material, not two-sided artwork printing. Check the product for embossed or flat construction.' }
];