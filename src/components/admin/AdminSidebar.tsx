'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  FileText,
  Users,
  MessageSquare,
  Settings,
  LogOut,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Logo from '@/components/ui/Logo';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'MAIN',
    items: [
      { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/admin/products', label: 'Products', icon: Package },
    ],
  },
  {
    title: 'SALES',
    items: [
      { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
      { href: '/admin/quotes', label: 'Quotes', icon: FileText },
    ],
  },
  {
    title: 'PEOPLE',
    items: [
      { href: '/admin/distributors', label: 'Distributors', icon: Users },
      { href: '/admin/contacts', label: 'Contacts', icon: MessageSquare },
    ],
  },
  {
    title: 'SYSTEM',
    items: [
      { href: '/admin/settings', label: 'Settings', icon: Settings },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  }

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    window.location.href = '/admin/login';
  }

  return (
    <aside className="w-64 bg-gray-950 text-gray-400 min-h-screen flex flex-col border-r border-gray-800/50">
      {/* Logo / Brand */}
      <div className="px-5 py-5 border-b border-gray-800/50">
        <Link href="/admin" className="flex flex-col gap-1 group">
          <Logo size="sm" variant="light" />
          <span className="text-[11px] text-gray-500">Admin Panel</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-6 overflow-y-auto">
        {navSections.map((section) => (
          <div key={section.title}>
            <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-widest text-gray-600">
              {section.title}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 text-[13px] font-medium rounded-lg transition-all duration-150',
                      active
                        ? 'bg-amber-500/10 text-amber-400 border-l-2 border-amber-500 pl-[10px]'
                        : 'hover:bg-gray-800/60 hover:text-gray-200 border-l-2 border-transparent pl-[10px]'
                    )}
                  >
                    <Icon
                      className={cn(
                        'w-4 h-4 flex-shrink-0',
                        active ? 'text-amber-400' : 'text-gray-500'
                      )}
                    />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-gray-800/50 space-y-1">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 px-3 py-2 text-[13px] font-medium rounded-lg hover:bg-gray-800/60 hover:text-gray-200 transition-all duration-150"
        >
          <ExternalLink className="w-4 h-4 text-gray-500" />
          View Site
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 text-[13px] font-medium rounded-lg hover:bg-red-500/10 hover:text-red-400 transition-all duration-150 w-full text-left"
        >
          <LogOut className="w-4 h-4 text-gray-500" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
