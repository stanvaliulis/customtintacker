import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { isDatabaseConfigured } from '@/lib/env';
import { products } from '@/data/products';
import { readJsonFile } from '@/lib/json-store';

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // If database is connected, use Prisma. Otherwise return JSON file / static fallback data.
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
      // Fall through to JSON/static fallback
    }
  }

  // Static + JSON file fallback — no database connected
  interface JsonRecord { id: string; status: string; [key: string]: unknown }
  interface OrderRecord { status: string; total?: number; [key: string]: unknown }

  const quotes = readJsonFile<JsonRecord[]>('quotes.json', []);
  const contacts = readJsonFile<JsonRecord[]>('contacts.json', []);
  const distributors = readJsonFile<JsonRecord[]>('distributors.json', []);
  const orders = readJsonFile<OrderRecord[]>('orders.json', []);

  const pendingQuotes = quotes.filter((q) => q.status === 'new' || q.status === 'pending').length;
  const pendingApplications = distributors.filter((d) => d.status === 'pending').length;
  const pendingOrders = orders.filter((o) => o.status === 'pending').length;
  const totalRevenue = orders.reduce((sum, o) => sum + (typeof o.total === 'number' ? o.total : 0), 0);

  const recentQuotes = quotes.slice(0, 5).map((q) => ({
    id: q.id,
    name: q.name as string || '',
    email: q.email as string || '',
    company: q.company as string || '',
    size: q.size as string || '',
    quantity: q.quantity as number || 0,
    status: q.status,
    submittedAt: q.submittedAt as string || '',
  }));

  const recentApplications = distributors.slice(0, 5).map((a) => ({
    id: a.id,
    companyName: a.companyName as string || '',
    contactName: a.contactName as string || '',
    email: a.email as string || '',
    asiNumber: a.asiNumber as string || '',
    sageNumber: a.sageNumber as string || '',
    ppaiNumber: a.ppaiNumber as string || '',
    status: a.status,
    submittedAt: a.submittedAt as string || '',
  }));

  return NextResponse.json({
    totalProducts: products.length,
    pendingQuotes,
    totalQuotes: quotes.length,
    pendingApplications,
    totalApplications: distributors.length,
    totalContacts: contacts.length,
    totalOrders: orders.length,
    totalRevenue,
    pendingOrders,
    recentQuotes,
    recentApplications,
    _notice: !quotes.length && !contacts.length && !distributors.length && !orders.length
      ? 'No database connected. Showing static product count and JSON file data.'
      : undefined,
  });
}
