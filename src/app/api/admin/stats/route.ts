import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { isDatabaseConfigured } from '@/lib/env';
import { products } from '@/data/products';

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // If database is connected, use Prisma. Otherwise return static fallback data.
  if (isDatabaseConfigured()) {
    try {
      const { prisma } = await import('@/lib/db');
      const [
        totalProducts,
        totalQuotes,
        pendingQuotes,
        totalApplications,
        pendingApplications,
        totalContacts,
        totalOrders,
        pendingOrders,
        revenueResult,
        recentQuotesRaw,
        recentApplicationsRaw,
      ] = await Promise.all([
        prisma.product.count(),
        prisma.quote.count(),
        prisma.quote.count({ where: { status: { in: ['new', 'pending'] } } }),
        prisma.distributorApplication.count(),
        prisma.distributorApplication.count({ where: { status: 'pending' } }),
        prisma.contact.count(),
        prisma.order.count(),
        prisma.order.count({ where: { status: 'pending' } }),
        prisma.order.aggregate({ _sum: { total: true } }),
        prisma.quote.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }),
        prisma.distributorApplication.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }),
      ]);

      const totalRevenue = revenueResult._sum.total ?? 0;

      const recentQuotes = recentQuotesRaw.map((q) => ({
        id: q.id,
        name: q.name,
        email: q.email,
        company: q.company,
        size: q.size,
        quantity: q.quantity,
        status: q.status,
        submittedAt: q.createdAt.toISOString(),
      }));

      const recentApplications = recentApplicationsRaw.map((a) => ({
        id: a.id,
        companyName: a.companyName,
        contactName: a.contactName,
        email: a.email,
        asiNumber: a.asiNumber,
        sageNumber: a.sageNumber,
        ppaiNumber: a.ppaiNumber,
        status: a.status,
        submittedAt: a.createdAt.toISOString(),
      }));

      return NextResponse.json({
        totalProducts,
        pendingQuotes,
        totalQuotes,
        pendingApplications,
        totalApplications,
        totalContacts,
        totalOrders,
        totalRevenue,
        pendingOrders,
        recentQuotes,
        recentApplications,
      });
    } catch (err) {
      console.error('Stats API error (DB):', err);
      // Fall through to static fallback
    }
  }

  // Static fallback — no database connected
  return NextResponse.json({
    totalProducts: products.length,
    pendingQuotes: 0,
    totalQuotes: 0,
    pendingApplications: 0,
    totalApplications: 0,
    totalContacts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    recentQuotes: [],
    recentApplications: [],
    _notice: 'No database connected. Showing static product count only.',
  });
}
