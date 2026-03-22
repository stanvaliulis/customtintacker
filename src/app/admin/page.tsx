'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Package,
  FileText,
  Users,
  MessageSquare,
  ShoppingBag,
  DollarSign,
  Plus,
  ArrowRight,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* ---------- Types ---------- */

interface QuoteItem {
  id: string;
  name: string;
  email: string;
  company: string;
  size: string;
  quantity: number;
  status: string;
  submittedAt: string;
}

interface ApplicationItem {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  asiNumber?: string;
  sageNumber?: string;
  ppaiNumber?: string;
  status: string;
  submittedAt: string;
}

interface DashboardStats {
  totalProducts: number;
  pendingQuotes: number;
  totalQuotes: number;
  pendingApplications: number;
  totalApplications: number;
  totalContacts: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  recentQuotes: QuoteItem[];
  recentApplications: ApplicationItem[];
}

/* ---------- Metric Card ---------- */

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: 'amber' | 'blue' | 'green' | 'purple';
  subtext?: string;
}

const accentStyles = {
  amber: {
    bg: 'bg-amber-500/10',
    icon: 'text-amber-400',
    border: 'border-amber-500/20',
    glow: 'shadow-amber-500/5',
  },
  blue: {
    bg: 'bg-blue-500/10',
    icon: 'text-blue-400',
    border: 'border-blue-500/20',
    glow: 'shadow-blue-500/5',
  },
  green: {
    bg: 'bg-emerald-500/10',
    icon: 'text-emerald-400',
    border: 'border-emerald-500/20',
    glow: 'shadow-emerald-500/5',
  },
  purple: {
    bg: 'bg-purple-500/10',
    icon: 'text-purple-400',
    border: 'border-purple-500/20',
    glow: 'shadow-purple-500/5',
  },
};

function MetricCard({ label, value, icon: Icon, accentColor, subtext }: MetricCardProps) {
  const styles = accentStyles[accentColor];

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border bg-gray-900 p-5 transition-all duration-200 hover:shadow-lg',
        styles.border,
        styles.glow
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
            {label}
          </p>
          <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
          {subtext && (
            <p className="text-xs text-gray-500">{subtext}</p>
          )}
        </div>
        <div className={cn('rounded-lg p-2.5', styles.bg)}>
          <Icon className={cn('w-5 h-5', styles.icon)} />
        </div>
      </div>
    </div>
  );
}

/* ---------- Status Badge ---------- */

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  let classes = 'bg-gray-700/50 text-gray-300';

  if (normalized === 'new' || normalized === 'pending') {
    classes = 'bg-amber-500/15 text-amber-400';
  } else if (normalized === 'approved' || normalized === 'completed') {
    classes = 'bg-emerald-500/15 text-emerald-400';
  } else if (normalized === 'rejected' || normalized === 'declined') {
    classes = 'bg-red-500/15 text-red-400';
  } else if (normalized === 'in_review' || normalized === 'reviewing') {
    classes = 'bg-blue-500/15 text-blue-400';
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold uppercase tracking-wide',
        classes
      )}
    >
      {status}
    </span>
  );
}

/* ---------- Date formatter ---------- */

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

/* ---------- Quick Action ---------- */

interface QuickActionProps {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

function QuickAction({ label, href, icon: Icon, description }: QuickActionProps) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-xl border border-gray-800 bg-gray-900 p-4 transition-all duration-200 hover:border-gray-700 hover:bg-gray-800/80"
    >
      <div className="rounded-lg bg-gray-800 p-2.5 group-hover:bg-gray-700 transition-colors">
        <Icon className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
      <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors" />
    </Link>
  );
}

/* ---------- Membership IDs helper ---------- */

function getMembershipIds(app: ApplicationItem): string {
  const ids: string[] = [];
  if (app.asiNumber) ids.push(`ASI: ${app.asiNumber}`);
  if (app.sageNumber) ids.push(`SAGE: ${app.sageNumber}`);
  if (app.ppaiNumber) ids.push(`PPAI: ${app.ppaiNumber}`);
  return ids.length > 0 ? ids.join(', ') : '\u2014';
}

/* ---------- Dashboard ---------- */

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => r.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-amber-600 rounded-full animate-spin" />
          <span className="text-sm text-gray-500">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-gray-500 mb-2">Unable to load dashboard data.</p>
          <button
            onClick={() => window.location.reload()}
            className="text-amber-600 hover:text-amber-700 text-sm font-medium"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-[1400px]">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <TrendingUp className="w-5 h-5 text-amber-500" />
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        </div>
        <p className="text-sm text-gray-500">
          Overview of your store activity and submissions
        </p>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <MetricCard
          label="Total Products"
          value={stats.totalProducts}
          icon={Package}
          accentColor="amber"
          subtext="In catalog"
        />
        <MetricCard
          label="Pending Quotes"
          value={stats.pendingQuotes}
          icon={FileText}
          accentColor="blue"
          subtext={`${stats.totalQuotes} total`}
        />
        <MetricCard
          label="Distributor Apps"
          value={stats.pendingApplications}
          icon={Users}
          accentColor="green"
          subtext={`${stats.totalApplications} total`}
        />
        <MetricCard
          label="Contact Messages"
          value={stats.totalContacts}
          icon={MessageSquare}
          accentColor="purple"
          subtext="All time"
        />
        <MetricCard
          label="Total Orders"
          value={stats.totalOrders}
          icon={ShoppingBag}
          accentColor="amber"
          subtext={stats.pendingOrders > 0 ? `${stats.pendingOrders} pending` : 'No orders yet'}
        />
        <MetricCard
          label="Revenue"
          value={formatCurrency(stats.totalRevenue)}
          icon={DollarSign}
          accentColor="green"
          subtext="All time"
        />
      </div>

      {/* Two-column tables */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        {/* Recent Quotes */}
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-500" />
              <h2 className="text-sm font-semibold text-gray-900">Recent Quotes</h2>
            </div>
            <Link
              href="/admin/quotes"
              className="text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors"
            >
              View all
            </Link>
          </div>

          {stats.recentQuotes.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No quote requests yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 uppercase tracking-wider">
                    <th className="text-left px-5 py-2.5 font-medium">Name</th>
                    <th className="text-left px-5 py-2.5 font-medium">Product</th>
                    <th className="text-left px-5 py-2.5 font-medium">Date</th>
                    <th className="text-left px-5 py-2.5 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {stats.recentQuotes.map((quote) => (
                    <tr
                      key={quote.id}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-5 py-3">
                        <div className="font-medium text-gray-900 text-sm truncate max-w-[140px]">
                          {quote.name}
                        </div>
                        <div className="text-xs text-gray-400 truncate max-w-[140px]">
                          {quote.email}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-gray-600 text-xs">{quote.size}</span>
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {formatDate(quote.submittedAt)}
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={quote.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Applications */}
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-500" />
              <h2 className="text-sm font-semibold text-gray-900">
                Recent Applications
              </h2>
            </div>
            <Link
              href="/admin/distributors"
              className="text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors"
            >
              View all
            </Link>
          </div>

          {stats.recentApplications.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No applications yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 uppercase tracking-wider">
                    <th className="text-left px-5 py-2.5 font-medium">Company</th>
                    <th className="text-left px-5 py-2.5 font-medium">IDs</th>
                    <th className="text-left px-5 py-2.5 font-medium">Date</th>
                    <th className="text-left px-5 py-2.5 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {stats.recentApplications.map((app) => (
                    <tr
                      key={app.id}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-5 py-3">
                        <div className="font-medium text-gray-900 text-sm truncate max-w-[140px]">
                          {app.companyName}
                        </div>
                        <div className="text-xs text-gray-400 truncate max-w-[140px]">
                          {app.contactName}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-gray-500 text-xs truncate block max-w-[120px]">
                          {getMembershipIds(app)}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {formatDate(app.submittedAt)}
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={app.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          <QuickAction
            label="Add Product"
            href="/admin/products/new"
            icon={Plus}
            description="Create a new tin tacker listing"
          />
          <QuickAction
            label="View All Quotes"
            href="/admin/quotes"
            icon={FileText}
            description="Review and respond to quote requests"
          />
          <QuickAction
            label="Review Applications"
            href="/admin/distributors"
            icon={Users}
            description="Manage distributor applications"
          />
          <QuickAction
            label="Site Settings"
            href="/admin/settings"
            icon={Package}
            description="Configure store and company info"
          />
        </div>
      </div>
    </div>
  );
}
