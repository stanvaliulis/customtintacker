'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useDistributor } from '@/context/DistributorContext';
import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import {
  Building2,
  LogOut,
  Tag,
  ShoppingBag,
  FileText,
  Package,
  Percent,
  Hash,
  Clock,
} from 'lucide-react';

export default function AccountPage() {
  const router = useRouter();
  const { isDistributor, distributorInfo, distributorDiscount } = useDistributor();

  useEffect(() => {
    if (!isDistributor) {
      router.push('/wholesale/login');
    }
  }, [isDistributor, router]);

  if (!isDistributor || !distributorInfo) {
    return (
      <section className="py-16">
        <Container>
          <div className="text-center text-gray-500">Loading...</div>
        </Container>
      </section>
    );
  }

  const discountPercent = Math.round(distributorDiscount * 100);

  return (
    <div className="min-h-screen bg-gray-950">
      <section className="py-10 sm:py-14">
        <Container>
          {/* Header */}
          <div className="flex items-center justify-between mb-10">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white">
                    {distributorInfo.companyName}
                  </h1>
                  <p className="text-gray-400 text-sm">
                    Welcome back, {distributorInfo.contactName}
                  </p>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              onClick={() => signOut({ callbackUrl: '/' })}
              className="text-gray-400 hover:text-white gap-1.5"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>

          {/* Savings Banner */}
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 mb-8 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
              <Percent className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <p className="text-white font-semibold">
                You save {discountPercent}% as a distributor
              </p>
              <p className="text-sm text-gray-400 mt-0.5">
                Distributor pricing is automatically applied across all products. Browse and shop the catalog with your discounted rates.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Company Info */}
            <div className="lg:col-span-1">
              <div className="rounded-xl border border-gray-800 bg-gray-900/80 p-6">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                  Account Details
                </h2>
                <div className="space-y-4">
                  <InfoRow
                    icon={<Building2 className="w-4 h-4" />}
                    label="Company"
                    value={distributorInfo.companyName}
                  />
                  <InfoRow
                    icon={<Tag className="w-4 h-4" />}
                    label="Discount Tier"
                    value={`${discountPercent}% off catalog`}
                  />
                  {distributorInfo.asiNumber && (
                    <InfoRow
                      icon={<Hash className="w-4 h-4" />}
                      label="ASI Number"
                      value={distributorInfo.asiNumber}
                    />
                  )}
                  {distributorInfo.sageNumber && (
                    <InfoRow
                      icon={<Hash className="w-4 h-4" />}
                      label="SAGE Number"
                      value={distributorInfo.sageNumber}
                    />
                  )}
                  {distributorInfo.ppaiNumber && (
                    <InfoRow
                      icon={<Hash className="w-4 h-4" />}
                      label="PPAI Number"
                      value={distributorInfo.ppaiNumber}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Quick Links and Order History */}
            <div className="lg:col-span-2 space-y-8">
              {/* Quick Links */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <QuickLink
                  href="/products"
                  icon={<Package className="w-5 h-5" />}
                  label="Browse Products"
                  description="Shop with your distributor pricing"
                />
                <QuickLink
                  href="/quote"
                  icon={<FileText className="w-5 h-5" />}
                  label="Request Quote"
                  description="Get custom pricing for large orders"
                />
                <QuickLink
                  href="/cart"
                  icon={<ShoppingBag className="w-5 h-5" />}
                  label="View Cart"
                  description="Review items in your cart"
                />
              </div>

              {/* Order History Placeholder */}
              <div className="rounded-xl border border-gray-800 bg-gray-900/80 p-6">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Order History
                </h2>
                <div className="text-center py-10">
                  <div className="w-12 h-12 rounded-xl bg-gray-800 flex items-center justify-center mx-auto mb-3">
                    <ShoppingBag className="w-6 h-6 text-gray-600" />
                  </div>
                  <p className="text-gray-500 text-sm">
                    Order history will appear here once you place your first order.
                  </p>
                  <Link
                    href="/products"
                    className="inline-flex items-center gap-1.5 mt-4 text-sm text-amber-400 hover:text-amber-300 font-medium transition-colors"
                  >
                    <Package className="w-4 h-4" />
                    Browse Products
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-amber-400/60 mt-0.5">{icon}</div>
      <div>
        <dt className="text-xs text-gray-500 font-medium uppercase tracking-wider">{label}</dt>
        <dd className="text-white text-sm font-medium mt-0.5">{value}</dd>
      </div>
    </div>
  );
}

function QuickLink({
  href,
  icon,
  label,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-gray-800 bg-gray-900/80 p-5 hover:border-amber-500/50 transition-all"
    >
      <div className="text-amber-400 mb-3 group-hover:text-amber-300 transition-colors">{icon}</div>
      <h3 className="text-white font-semibold text-sm mb-1">{label}</h3>
      <p className="text-xs text-gray-500">{description}</p>
    </Link>
  );
}
