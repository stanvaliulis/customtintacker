import Link from 'next/link';
import { signBuyingGuide, aluminumBuyingAnswer } from '@/data/sign-buying-guide';

export default function SignBuyingGuide() {
  return <section aria-labelledby="sign-buying-guide" className="py-12 border-t border-gray-800">
    <h2 id="sign-buying-guide" className="text-2xl font-bold text-white">Choose a sign for your artwork and display</h2>
    <p className="mt-4 text-gray-300">Tin tackers is a familiar name for branded display signs. Compare the material, construction and outline separately to find the right product.</p>
    <div className="grid md:grid-cols-2 gap-8 mt-8">{signBuyingGuide.map(item => <article key={item.href}>
      <h3 className="text-lg font-semibold text-white">{item.title}</h3>
      <p className="text-gray-300 mt-2">{item.text}</p>
      <Link className="inline-block mt-3 text-amber-300 underline" href={item.href}>{item.link}</Link>
    </article>)}</div>
    <h3 className="text-lg font-semibold text-white mt-8">How are the aluminum signs printed, and when do they ship?</h3>
    <p className="text-gray-300 mt-2">{aluminumBuyingAnswer}</p>
    <p className="text-gray-300 mt-4">An uploaded artwork preview helps communicate your direction; it is not a production proof. The team still reviews artwork quality, cutting, mounting holes and embossing feasibility. <Link href="/artwork-templates" className="text-amber-300 underline">Review artwork requirements</Link> before preparing your file.</p>
  </section>;
}
