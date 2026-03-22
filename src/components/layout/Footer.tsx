import Link from 'next/link';
import Container from '@/components/ui/Container';
import Logo from '@/components/ui/Logo';
import { siteConfig } from '@/data/siteConfig';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <Container className="py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <div className="mb-4">
              <Logo size="md" variant="light" />
            </div>
            <p className="text-sm text-gray-400">
              Premium custom embossed aluminum tin tacker signs. Proudly made in the USA by {siteConfig.company}.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Products</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/products?category=standard" className="hover:text-white transition-colors">Standard Tackers</Link></li>
              <li><Link href="/products?shape=circle" className="hover:text-white transition-colors">Circle Tackers</Link></li>
              <li><Link href="/products?shape=can" className="hover:text-white transition-colors">Can Shapes</Link></li>
              <li><Link href="/products?category=specialty" className="hover:text-white transition-colors">Specialty Shapes</Link></li>
              <li><Link href="/products?category=custom" className="hover:text-white transition-colors">Custom Die-Cut</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Company</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              <li><Link href="/quote" className="hover:text-white transition-colors">Request a Quote</Link></li>
              <li><Link href="/distributors" className="hover:text-white transition-colors">Distributor Program</Link></li>
              <li><Link href="/distributors/apply" className="hover:text-white transition-colors">Apply as Distributor</Link></li>
              <li><Link href="/wholesale/login" className="hover:text-white transition-colors">Wholesale Portal</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Contact Us</h3>
            <ul className="space-y-2 text-sm">
              <li>{siteConfig.email}</li>
              <li>{siteConfig.phone}</li>
              <li>{siteConfig.address.city}, {siteConfig.address.state}</li>
            </ul>
            <div className="mt-4 inline-flex items-center gap-2 bg-green-900/30 text-green-400 px-3 py-1.5 rounded-full text-xs font-medium">
              <span className="w-2 h-2 bg-green-400 rounded-full" />
              Made in USA
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800 text-sm text-gray-500 text-center">
          <p>&copy; {new Date().getFullYear()} {siteConfig.company}. All rights reserved.</p>
          <p className="mt-1 text-xs text-gray-600">{siteConfig.parentCompanyTagline}</p>
        </div>
      </Container>
    </footer>
  );
}
