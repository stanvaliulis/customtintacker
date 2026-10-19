import Link from 'next/link';
const routes = [
  { href: '/upload-proof', label: 'Upload & emboss', text: 'Fit finished artwork, review raised-area suggestions, or ask for a team proof.' },
  { href: '/design', label: 'Design your own', text: 'Choose an exact product and edit text, images and layouts.' },
  { href: '/mockup', label: 'Preview a mockup', text: 'See how your logo looks on a sample shape.' },
  { href: '/ai-designer', label: 'AI artwork review', text: 'Get artwork suggestions and an embossed preview.' },
  { href: '/artwork-templates', label: 'Artwork guides', text: 'Download guides to prepare files in your own design software.' },
];
export default function DesignRoutes({ current }: { current: string }) {
  return <nav aria-label="Design tools" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 my-8">
    {routes.map(route => <Link key={route.href} href={route.href} aria-current={current === route.href ? 'page' : undefined} className={`block rounded-xl border p-4 focus-visible:outline-2 focus-visible:outline-amber-400 ${current === route.href ? 'border-amber-500 bg-amber-500/10' : 'border-gray-700 bg-gray-900 hover:border-gray-500'}`}>
      <span className="font-semibold text-amber-300">{route.label}</span><span className="block mt-1 text-sm text-gray-300">{route.text}</span>
    </Link>)}
  </nav>;
}
