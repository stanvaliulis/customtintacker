import type { Metadata } from 'next';
import Container from '@/components/ui/Container';
import { getAllProducts } from '@/lib/products';
import ProductPicker from '@/components/design/ProductPicker';
import DesignRoutes from '@/components/design/DesignRoutes';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Design Your Sign Online',
  description: 'Choose your tin tacker size, shape and material. Customize editable layouts, add your artwork, save a draft and prepare your design for a quote.',
  alternates: { canonical: '/design' },
  openGraph: { title: 'Design Your Sign Online', url: '/design' },
};
export default async function DesignLandingPage() {
  const products = await getAllProducts();
  return <div className="bg-gray-950 min-h-screen py-12 text-white"><Container>
    <p className="text-amber-300 text-sm uppercase tracking-wider mb-3">Your artwork. Your sign.</p>
    <h1 className="text-3xl sm:text-5xl font-bold max-w-3xl">Make a sign that feels like your brand.</h1>
    <p className="mt-5 text-lg text-gray-300 max-w-3xl">Start by uploading your artwork for a guided fit and proof review. Prefer to create a layout? The designer is available below.</p>
    <nav aria-label="Choose your workflow" className="grid sm:grid-cols-2 gap-5 my-8"><Link href="/upload-proof" className="rounded-2xl bg-teal-900 p-7"><h2 className="text-3xl font-bold">Upload Artwork</h2><p className="mt-3">Already have artwork? Get an automatic fit and supported raised-area suggestions. Review the proof or ask the team to prepare it.</p><span className="block mt-5 underline">Upload finished artwork →</span></Link><Link href="#diy-products" className="rounded-2xl border border-gray-500 bg-gray-900 p-7"><h2 className="text-3xl font-bold">Design your own</h2><p className="mt-3">Start from editable templates or a blank canvas. Add text and images, arrange your layout, and work at your own pace.</p><span className="block mt-5 underline text-amber-300">Choose a product and open the designer →</span></Link></nav>
    <section id="diy-products" className="scroll-mt-24"><h2 className="text-2xl font-bold">Design your own: choose your product</h2><ProductPicker products={products} /></section>
    <details className="my-6"><summary className="cursor-pointer min-h-11">Other design resources</summary><DesignRoutes current="/design" /></details>

    <section className="border-t border-gray-700 pt-8 max-w-3xl space-y-5">
      <h2 className="text-2xl font-semibold">Before you send your artwork</h2>
      <p className="text-gray-300">Device drafts reopen in the same browser. Download an editable JSON backup to reopen on another device using the same product. A saved online design can be attached to your pricing request.</p>
      <p className="text-gray-300">Keep text and logos ¼ inch inside the trim. Prepare ⅛ inch bleed in your production file and use high-resolution images. The canvas and mockups are layout previews; your production proof confirms cut shapes, mounting holes, color and embossing.</p>
      <Link className="inline-block text-amber-300 underline min-h-11" href="/artwork-templates">Download artwork guides and review file requirements</Link>
    </section>
  </Container></div>;
}
