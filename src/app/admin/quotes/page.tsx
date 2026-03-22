'use client';

import { useEffect, useState } from 'react';
import {
  FileText,
  ChevronDown,
  ChevronUp,
  Trash2,
  Eye,
  MessageSquareQuote,
  Loader2,
  Inbox,
} from 'lucide-react';

interface QuoteRequest {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company: string;
  size: string;
  quantity: number;
  backing?: string;
  colors?: string;
  notes?: string;
  status: string;
  submittedAt: string;
}

type QuoteStatus = 'all' | 'new' | 'reviewed' | 'quoted' | 'accepted' | 'declined';

const STATUS_OPTIONS: QuoteStatus[] = ['all', 'new', 'reviewed', 'quoted', 'accepted', 'declined'];

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  reviewed: 'bg-amber-100 text-amber-700',
  quoted: 'bg-green-100 text-green-700',
  accepted: 'bg-emerald-100 text-emerald-700',
  declined: 'bg-red-100 text-red-700',
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function AdminQuotesPage() {
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<QuoteStatus>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchQuotes();
  }, []);

  async function fetchQuotes() {
    try {
      const res = await fetch('/api/admin/quotes');
      if (res.ok) {
        const data = await res.json();
        setQuotes(data);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: string, status: string) {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/quotes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const updated = await res.json();
        setQuotes((prev) => prev.map((q) => (q.id === id ? updated : q)));
      }
    } catch {
      // silently fail
    } finally {
      setActionLoading(null);
    }
  }

  async function deleteQuote(id: string, name: string) {
    if (!confirm(`Delete the quote request from "${name}"? This cannot be undone.`)) return;
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/quotes/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setQuotes((prev) => prev.filter((q) => q.id !== id));
        if (expandedId === id) setExpandedId(null);
      }
    } catch {
      // silently fail
    } finally {
      setActionLoading(null);
    }
  }

  const filtered = filter === 'all' ? quotes : quotes.filter((q) => q.status === filter);

  const statusCounts = quotes.reduce<Record<string, number>>((acc, q) => {
    acc[q.status] = (acc[q.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quote Requests</h1>
        <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
          {quotes.length}
        </span>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        {STATUS_OPTIONS.map((status) => {
          const count =
            status === 'all' ? quotes.length : statusCounts[status] || 0;
          return (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${
                filter === status
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {status}
              {count > 0 && (
                <span className="ml-1.5 text-xs text-gray-400">({count})</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
          <span className="ml-2 text-gray-500">Loading quotes...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">
            {filter === 'all'
              ? 'No quote requests yet'
              : `No ${filter} quote requests`}
          </p>
          <p className="text-gray-400 text-sm mt-1">
            Quote requests submitted through the website will appear here.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 w-8" />
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Company</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Product/Size</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Qty</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((quote) => (
                  <QuoteTableRow
                    key={quote.id}
                    quote={quote}
                    expanded={expandedId === quote.id}
                    onToggle={() =>
                      setExpandedId(expandedId === quote.id ? null : quote.id)
                    }
                    onUpdateStatus={updateStatus}
                    onDelete={deleteQuote}
                    actionLoading={actionLoading === quote.id}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((quote) => (
              <QuoteMobileCard
                key={quote.id}
                quote={quote}
                expanded={expandedId === quote.id}
                onToggle={() =>
                  setExpandedId(expandedId === quote.id ? null : quote.id)
                }
                onUpdateStatus={updateStatus}
                onDelete={deleteQuote}
                actionLoading={actionLoading === quote.id}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ───── Desktop Table Row ───── */

function QuoteTableRow({
  quote,
  expanded,
  onToggle,
  onUpdateStatus,
  onDelete,
  actionLoading,
}: {
  quote: QuoteRequest;
  expanded: boolean;
  onToggle: () => void;
  onUpdateStatus: (id: string, status: string) => void;
  onDelete: (id: string, name: string) => void;
  actionLoading: boolean;
}) {
  return (
    <>
      <tr
        onClick={onToggle}
        className="hover:bg-gray-50 cursor-pointer transition-colors"
      >
        <td className="px-4 py-3 text-gray-400">
          {expanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </td>
        <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
          {formatDate(quote.submittedAt)}
        </td>
        <td className="px-4 py-3 font-medium text-gray-900">{quote.name}</td>
        <td className="px-4 py-3 text-gray-600">{quote.email}</td>
        <td className="px-4 py-3 text-gray-600">{quote.company}</td>
        <td className="px-4 py-3 text-gray-600">{quote.size}</td>
        <td className="px-4 py-3 text-right text-gray-900 font-medium">
          {quote.quantity.toLocaleString()}
        </td>
        <td className="px-4 py-3 text-center">
          <span
            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${
              STATUS_COLORS[quote.status] || 'bg-gray-100 text-gray-600'
            }`}
          >
            {quote.status}
          </span>
        </td>
        <td className="px-4 py-3 text-right">
          <div
            className="flex items-center justify-end gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            {quote.status === 'new' && (
              <button
                onClick={() => onUpdateStatus(quote.id, 'reviewed')}
                disabled={actionLoading}
                className="p-1.5 rounded hover:bg-amber-50 text-gray-400 hover:text-amber-600 transition-colors"
                title="Mark as Reviewed"
              >
                <Eye className="w-4 h-4" />
              </button>
            )}
            {(quote.status === 'new' || quote.status === 'reviewed') && (
              <button
                onClick={() => onUpdateStatus(quote.id, 'quoted')}
                disabled={actionLoading}
                className="p-1.5 rounded hover:bg-green-50 text-gray-400 hover:text-green-600 transition-colors"
                title="Mark as Quoted"
              >
                <MessageSquareQuote className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => onDelete(quote.id, quote.name)}
              disabled={actionLoading}
              className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={9} className="bg-gray-50 px-4 py-4 border-t border-gray-100">
            <QuoteDetails quote={quote} onUpdateStatus={onUpdateStatus} />
          </td>
        </tr>
      )}
    </>
  );
}

/* ───── Mobile Card ───── */

function QuoteMobileCard({
  quote,
  expanded,
  onToggle,
  onUpdateStatus,
  onDelete,
  actionLoading,
}: {
  quote: QuoteRequest;
  expanded: boolean;
  onToggle: () => void;
  onUpdateStatus: (id: string, status: string) => void;
  onDelete: (id: string, name: string) => void;
  actionLoading: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-gray-900 truncate">{quote.name}</span>
            <span
              className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold capitalize shrink-0 ${
                STATUS_COLORS[quote.status] || 'bg-gray-100 text-gray-600'
              }`}
            >
              {quote.status}
            </span>
          </div>
          <div className="text-xs text-gray-500">
            {quote.company} &middot; {quote.size} &middot; Qty: {quote.quantity.toLocaleString()}
          </div>
          <div className="text-xs text-gray-400 mt-0.5">{formatDate(quote.submittedAt)}</div>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-3">
          <QuoteDetails quote={quote} onUpdateStatus={onUpdateStatus} />
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
            {quote.status === 'new' && (
              <button
                onClick={() => onUpdateStatus(quote.id, 'reviewed')}
                disabled={actionLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                Mark Reviewed
              </button>
            )}
            {(quote.status === 'new' || quote.status === 'reviewed') && (
              <button
                onClick={() => onUpdateStatus(quote.id, 'quoted')}
                disabled={actionLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
              >
                <MessageSquareQuote className="w-3.5 h-3.5" />
                Mark Quoted
              </button>
            )}
            <button
              onClick={() => onDelete(quote.id, quote.name)}
              disabled={actionLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors ml-auto"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ───── Expanded Details ───── */

function QuoteDetails({
  quote,
  onUpdateStatus,
}: {
  quote: QuoteRequest;
  onUpdateStatus: (id: string, status: string) => void;
}) {
  const details = [
    { label: 'Email', value: quote.email },
    { label: 'Phone', value: quote.phone || '---' },
    { label: 'Company', value: quote.company },
    { label: 'Size / Shape', value: quote.size },
    { label: 'Quantity', value: quote.quantity.toLocaleString() },
    { label: 'Backing', value: quote.backing || '---' },
    { label: 'Colors', value: quote.colors || '---' },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {details.map((d) => (
          <div key={d.label}>
            <dt className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              {d.label}
            </dt>
            <dd className="text-sm text-gray-900 mt-0.5">{d.value}</dd>
          </div>
        ))}
      </div>

      {quote.notes && (
        <div>
          <dt className="text-xs font-medium text-gray-400 uppercase tracking-wide">Notes</dt>
          <dd className="text-sm text-gray-900 mt-0.5 whitespace-pre-wrap bg-white rounded-lg border border-gray-200 p-3">
            {quote.notes}
          </dd>
        </div>
      )}

      {/* Status quick-update */}
      <div className="flex items-center gap-2 pt-2">
        <span className="text-xs text-gray-400 mr-1">Set status:</span>
        {(['new', 'reviewed', 'quoted', 'accepted', 'declined'] as const).map((s) => (
          <button
            key={s}
            onClick={() => onUpdateStatus(quote.id, s)}
            disabled={quote.status === s}
            className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize transition-colors ${
              quote.status === s
                ? `${STATUS_COLORS[s]} ring-2 ring-offset-1 ring-gray-300 cursor-default`
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
