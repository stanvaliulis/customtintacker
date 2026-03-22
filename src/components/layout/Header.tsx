'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingCart, Menu, X, User } from 'lucide-react';
import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import Container from '@/components/ui/Container';
import Logo from '@/components/ui/Logo';

const navLinks = [
  { href: '/products', label: 'Products' },
  { href: '/design', label: 'Design Online' },
  { href: '/quote', label: 'Request Quote' },
  { href: '/distributors', label: 'Distributors' },
  { href: '/about', label: 'About' },
  { href: '/blog', label: 'Blog' },
  { href: '/contact', label: 'Contact' },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { itemCount } = useCart();
  const pathname = usePathname();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <Container>
        <div className="flex items-center justify-between h-20">
          <Link href="/" className="flex items-center">
            <Logo size="sm" variant="dark" />
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={pathname === link.href ? 'page' : undefined}
                className={`font-medium transition-colors ${pathname === link.href ? 'text-amber-600' : 'text-gray-600 hover:text-gray-900'}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <Link
              href="/wholesale/login"
              className="hidden sm:flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <User className="w-4 h-4" />
              Distributor Login
            </Link>

            <Link href="/cart" className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors">
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-amber-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </Link>

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900"
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </Container>

      {mobileOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <nav className="flex flex-col py-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                aria-current={pathname === link.href ? 'page' : undefined}
                className={`px-6 py-3 hover:bg-gray-50 font-medium ${pathname === link.href ? 'text-amber-600 bg-amber-50/50' : 'text-gray-600 hover:text-gray-900'}`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/wholesale/login"
              onClick={() => setMobileOpen(false)}
              className="px-6 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 font-medium flex items-center gap-2"
            >
              <User className="w-4 h-4" />
              Distributor Login
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
