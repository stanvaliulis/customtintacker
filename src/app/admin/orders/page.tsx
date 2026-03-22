'use client';

import {
  ShoppingBag,
  CreditCard,
  Zap,
  Package,
  Truck,
  CheckCircle,
} from 'lucide-react';

const mockOrders = [
  {
    id: 'ORD-001',
    customer: 'John Smith',
    items: '2x Classic Round 14"',
    total: '$189.00',
    status: 'Shipped',
    date: 'Mar 18, 2026',
  },
  {
    id: 'ORD-002',
    customer: 'Sarah Johnson',
    items: '5x Custom Rectangle 18x12',
    total: '$425.00',
    status: 'Processing',
    date: 'Mar 17, 2026',
  },
  {
    id: 'ORD-003',
    customer: 'Mike Davis',
    items: '10x Die-Cut Shield',
    total: '$890.00',
    status: 'Pending',
    date: 'Mar 16, 2026',
  },
  {
    id: 'ORD-004',
    customer: 'Lisa Chen',
    items: '3x Oval 16"',
    total: '$267.00',
    status: 'Delivered',
    date: 'Mar 15, 2026',
  },
];

export default function OrdersPage() {
  return (
    <div className="p-8">
      {/* Page header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
          <ShoppingBag className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Track and manage customer orders
          </p>
        </div>
      </div>

      {/* Empty state */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center mb-8">
        <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-5">
          <ShoppingBag className="w-10 h-10 text-gray-300" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">No orders yet</h2>
        <p className="text-gray-500 max-w-md mx-auto mb-6">
          Orders will appear here once customers complete checkout. Connect your Stripe
          account and configure webhooks to start receiving orders.
        </p>

        {/* Coming soon callout */}
        <div className="inline-flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 text-left max-w-lg">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Zap className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-blue-900 mb-1">Coming Soon: Stripe Integration</p>
            <p className="text-sm text-blue-700">
              Stripe webhook integration will automatically create and update orders when
              customers complete payment. Order status will sync in real-time.
            </p>
          </div>
        </div>
      </div>

      {/* Preview section */}
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
          Preview: What orders will look like
        </h3>
      </div>

      {/* Mock orders table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden opacity-60 pointer-events-none select-none">
        {/* Stats bar */}
        <div className="grid grid-cols-4 gap-px bg-gray-100 border-b border-gray-200">
          {[
            { label: 'Total Orders', value: '4', icon: Package, color: 'text-blue-600' },
            { label: 'Processing', value: '1', icon: CreditCard, color: 'text-amber-600' },
            { label: 'Shipped', value: '1', icon: Truck, color: 'text-purple-600' },
            { label: 'Delivered', value: '1', icon: CheckCircle, color: 'text-green-600' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center">
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Table */}
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">
                Order
              </th>
              <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">
                Customer
              </th>
              <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">
                Items
              </th>
              <th className="text-right px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">
                Total
              </th>
              <th className="text-center px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">
                Status
              </th>
              <th className="text-right px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {mockOrders.map((order) => {
              const statusColors: Record<string, string> = {
                Pending: 'bg-gray-100 text-gray-600',
                Processing: 'bg-amber-50 text-amber-700',
                Shipped: 'bg-purple-50 text-purple-700',
                Delivered: 'bg-green-50 text-green-700',
              };
              return (
                <tr key={order.id} className="hover:bg-gray-50/50">
                  <td className="px-5 py-3.5">
                    <span className="font-mono text-xs font-semibold text-gray-900">
                      {order.id}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-700">{order.customer}</td>
                  <td className="px-5 py-3.5 text-gray-500">{order.items}</td>
                  <td className="px-5 py-3.5 text-right font-medium text-gray-900">
                    {order.total}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <span
                      className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                        statusColors[order.status] || statusColors.Pending
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right text-gray-500">{order.date}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-center text-xs text-gray-400 mt-3 italic">
        Example data shown above for preview purposes only
      </p>
    </div>
  );
}
