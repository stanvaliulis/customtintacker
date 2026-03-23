'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { ShoppingCart, Menu, X, User, LogOut, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { useDistributor } from '@/context/DistributorContext';
import Container from '@/components/ui/Container';
import Logo from '@/components/ui/Logo';

const industryLinks = [
  { href: '/brewery-signs', label: 'Brewery Signs' },
  { href: '/bar-signs', label: 'Bar & Pub Signs' },
  { href: '/cannabis-signs', label: 'Cannabis Signs' },
  { href: '/restaurant-signs', label: 'Restaurant Signs' },
  { href: '/coffee-signs', label: 'Coffee & Cafe Signs' },
  { href: '/sports-signs', label: 'Sports Signs' },
];

const navLinks = [
  { href: '/products', label: 'Products' },
  { href: '/quote', label: 'Get a Quote' },
  { href: '/distributors', label: 'Distributors' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [industriesOpen, setIndustriesOpen] = useState(false);
  const [mobileIndustriesOpen, setMobileIndustriesOpen] = useState(false);
  const industriesRef = useRef<HTMLDivElement>(null);
  const { itemCount } = useCart();
  const { isDistributor, distributorInfo } = useDistributor();
  const pathname = usePathname();

  // Close industries dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (industriesRef.current && !industriesRef.current.contains(event.target as Node)) {
        setIndustriesOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      {/* Slim distributor bar — only when logged in */}
      {isDistributor && (
        <div className="bg-gray-900 text-center py-1">
          <p className="text-[11px] text-emerald-400 font-medium tracking-wide">
            <span className="inline-block w-1.5 h-1.5 bg-emerald-400 rounded-full mr-1.5 relative -top-[1px]" />
            Distributor pricing active — {distributorInfo?.companyName}
          </p>
        </div>
      )}

      <Container>
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center shrink-0">
            <Logo size="sm" variant="dark" />
          </Link>

          <nav className="hidden lg:flex items-center gap-7">
            <Link
              href="/products"
              aria-current={pathname === '/products' ? 'page' : undefined}
              className={`text-sm font-medium transition-colors ${pathname === '/products' ? 'text-amber-600' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Products
            </Link>

            {/* Industries Dropdown */}
            <div className="relative" ref={industriesRef}>
              <button
                onClick={() => setIndustriesOpen(!industriesOpen)}
                className={`text-sm font-medium transition-colors flex items-center gap-1 ${
                  industryLinks.some((l) => pathname === l.href)
                    ? 'text-amber-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Industries
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${industriesOpen ? 'rotate-180' : ''}`} />
              </button>
              {industriesOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-52 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                  {industryLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIndustriesOpen(false)}
                      className={`block px-4 py-2 text-sm transition-colors ${
                        pathname === link.href
                          ? 'text-amber-600 bg-amber-50/50'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {navLinks
              .filter((link) => link.href !== '/products')
              .map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={pathname === link.href ? 'page' : undefined}
                  className={`text-sm font-medium transition-colors ${pathname === link.href ? 'text-amber-600' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  {link.label}
                </Link>
              ))}
          </nav>

          <div className="flex items-center gap-3">
            {isDistributor ? (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  href="/account"
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1.5"
                >
                  <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                  Account
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <Link
                href="/wholesale/login"
                className="hidden sm:flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                <User className="w-3.5 h-3.5" />
                <span className="text-xs">Login</span>
              </Link>
            )}

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
              className="lg:hidden p-2 text-gray-600 hover:text-gray-900"
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </Container>

      {mobileOpen && (
        <div className="lg:hidden border-t border-gray-200 bg-white">
          <nav className="flex flex-col py-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                aria-current={pathname === link.href ? 'page' : undefined}
                className={`px-6 py-3 text-sm font-medium ${pathname === link.href ? 'text-amber-600 bg-amber-50/50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
              >
                {link.label}
              </Link>
            ))}

            {/* Mobile Industries Accordion */}
            <button
              onClick={() => setMobileIndustriesOpen(!mobileIndustriesOpen)}
              className={`px-6 py-3 text-sm font-medium flex items-center justify-between ${
                industryLinks.some((l) => pathname === l.href)
                  ? 'text-amber-600 bg-amber-50/50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Industries
              <ChevronDown className={`w-4 h-4 transition-transform ${mobileIndustriesOpen ? 'rotate-180' : ''}`} />
            </button>
            {mobileIndustriesOpen && (
              <div className="bg-gray-50">
                {industryLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => {
                      setMobileOpen(false);
                      setMobileIndustriesOpen(false);
                    }}
                    className={`block pl-10 pr-6 py-2.5 text-sm ${
                      pathname === link.href
                        ? 'text-amber-600'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}

            <Link
              href="/blog"
              onClick={() => setMobileOpen(false)}
              className="px-6 py-3 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 font-medium"
            >
              Blog
            </Link>

            {isDistributor ? (
              <>
                <div className="border-t border-gray-100 mt-1 pt-1">
                  <Link
                    href="/account"
                    onClick={() => setMobileOpen(false)}
                    className="px-6 py-3 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 font-medium flex items-center gap-2"
                  >
                    <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                    My Account
                  </Link>
                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      signOut({ callbackUrl: '/' });
                    }}
                    className="px-6 py-3 text-sm text-gray-400 hover:text-gray-600 hover:bg-gray-50 font-medium flex items-center gap-2 text-left w-full"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </>
            ) : (
              <div className="border-t border-gray-100 mt-1 pt-1">
                <Link
                  href="/wholesale/login"
                  onClick={() => setMobileOpen(false)}
                  className="px-6 py-3 text-sm text-gray-400 hover:text-gray-600 hover:bg-gray-50 font-medium flex items-center gap-2"
                >
                  <User className="w-4 h-4" />
                  Distributor Login
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
