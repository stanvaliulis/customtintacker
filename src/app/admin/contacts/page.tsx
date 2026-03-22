'use client';

import { useEffect, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Trash2,
  Eye,
  Reply,
  Archive,
  Loader2,
  Inbox,
  Mail,
} from 'lucide-react';

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message: string;
  status: string;
  submittedAt: string;
}

type ContactStatus = 'all' | 'new' | 'read' | 'replied' | 'archived';

const STATUS_OPTIONS: ContactStatus[] = ['all', 'new', 'read', 'replied', 'archived'];

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  read: 'bg-amber-100 text-amber-700',
  replied: 'bg-green-100 text-green-700',
  archived: 'bg-gray-200 text-gray-600',
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

function truncate(str: string, len: number) {
  if (str.length <= len) return str;
  return str.slice(0, len).trimEnd() + '...';
}

export default function AdminContactsPage() {
  const [contacts, setContacts] = useState<ContactSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ContactStatus>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchContacts();
  }, []);

  async function fetchContacts() {
    try {
      const res = await fetch('/api/admin/contacts');
      if (res.ok) {
        const data = await res.json();
        setContacts(data);
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
      const res = await fetch(`/api/admin/contacts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const updated = await res.json();
        setContacts((prev) => prev.map((c) => (c.id === id ? updated : c)));
      }
    } catch {
      // silently fail
    } finally {
      setActionLoading(null);
    }
  }

  async function deleteContact(id: string, name: string) {
    if (!confirm(`Delete the message from "${name}"? This cannot be undone.`)) return;
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/contacts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setContacts((prev) => prev.filter((c) => c.id !== id));
        if (expandedId === id) setExpandedId(null);
      }
    } catch {
      // silently fail
    } finally {
      setActionLoading(null);
    }
  }

  const filtered =
    filter === 'all' ? contacts : contacts.filter((c) => c.status === filter);

  const statusCounts = contacts.reduce<Record<string, number>>((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Contact Messages</h1>
        <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
          {contacts.length}
        </span>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        {STATUS_OPTIONS.map((status) => {
          const count =
            status === 'all' ? contacts.length : statusCounts[status] || 0;
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
          <span className="ml-2 text-gray-500">Loading messages...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">
            {filter === 'all'
              ? 'No contact messages yet'
              : `No ${filter} messages`}
          </p>
          <p className="text-gray-400 text-sm mt-1">
            Messages submitted through the contact form will appear here.
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
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Message</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((contact) => (
                  <ContactTableRow
                    key={contact.id}
                    contact={contact}
                    expanded={expandedId === contact.id}
                    onToggle={() =>
                      setExpandedId(expandedId === contact.id ? null : contact.id)
                    }
                    onUpdateStatus={updateStatus}
                    onDelete={deleteContact}
                    actionLoading={actionLoading === contact.id}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((contact) => (
              <ContactMobileCard
                key={contact.id}
                contact={contact}
                expanded={expandedId === contact.id}
                onToggle={() =>
                  setExpandedId(expandedId === contact.id ? null : contact.id)
                }
                onUpdateStatus={updateStatus}
                onDelete={deleteContact}
                actionLoading={actionLoading === contact.id}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ───── Desktop Table Row ───── */

function ContactTableRow({
  contact,
  expanded,
  onToggle,
  onUpdateStatus,
  onDelete,
  actionLoading,
}: {
  contact: ContactSubmission;
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
          {formatDate(contact.submittedAt)}
        </td>
        <td className="px-4 py-3">
          <div className="font-medium text-gray-900">{contact.name}</div>
          {contact.company && (
            <div className="text-xs text-gray-400">{contact.company}</div>
          )}
        </td>
        <td className="px-4 py-3 text-gray-600">{contact.email}</td>
        <td className="px-4 py-3 text-gray-600 max-w-xs">
          <span className="block truncate">{truncate(contact.message, 80)}</span>
        </td>
        <td className="px-4 py-3 text-center">
          <span
            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${
              STATUS_COLORS[contact.status] || 'bg-gray-100 text-gray-600'
            }`}
          >
            {contact.status}
          </span>
        </td>
        <td className="px-4 py-3 text-right">
          <div
            className="flex items-center justify-end gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            {contact.status === 'new' && (
              <button
                onClick={() => onUpdateStatus(contact.id, 'read')}
                disabled={actionLoading}
                className="p-1.5 rounded hover:bg-amber-50 text-gray-400 hover:text-amber-600 transition-colors"
                title="Mark as Read"
              >
                <Eye className="w-4 h-4" />
              </button>
            )}
            {(contact.status === 'new' || contact.status === 'read') && (
              <button
                onClick={() => onUpdateStatus(contact.id, 'replied')}
                disabled={actionLoading}
                className="p-1.5 rounded hover:bg-green-50 text-gray-400 hover:text-green-600 transition-colors"
                title="Mark as Replied"
              >
                <Reply className="w-4 h-4" />
              </button>
            )}
            {contact.status !== 'archived' && (
              <button
                onClick={() => onUpdateStatus(contact.id, 'archived')}
                disabled={actionLoading}
                className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                title="Archive"
              >
                <Archive className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => onDelete(contact.id, contact.name)}
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
          <td colSpan={7} className="bg-gray-50 px-4 py-4 border-t border-gray-100">
            <ContactDetails contact={contact} onUpdateStatus={onUpdateStatus} />
          </td>
        </tr>
      )}
    </>
  );
}

/* ───── Mobile Card ───── */

function ContactMobileCard({
  contact,
  expanded,
  onToggle,
  onUpdateStatus,
  onDelete,
  actionLoading,
}: {
  contact: ContactSubmission;
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
        <Mail className="w-4 h-4 text-gray-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-gray-900 truncate">{contact.name}</span>
            <span
              className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold capitalize shrink-0 ${
                STATUS_COLORS[contact.status] || 'bg-gray-100 text-gray-600'
              }`}
            >
              {contact.status}
            </span>
          </div>
          <div className="text-xs text-gray-500 truncate">{truncate(contact.message, 60)}</div>
          <div className="text-xs text-gray-400 mt-0.5">{formatDate(contact.submittedAt)}</div>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-3">
          <ContactDetails contact={contact} onUpdateStatus={onUpdateStatus} />
          <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-gray-100">
            {contact.status === 'new' && (
              <button
                onClick={() => onUpdateStatus(contact.id, 'read')}
                disabled={actionLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                Mark Read
              </button>
            )}
            {(contact.status === 'new' || contact.status === 'read') && (
              <button
                onClick={() => onUpdateStatus(contact.id, 'replied')}
                disabled={actionLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
              >
                <Reply className="w-3.5 h-3.5" />
                Mark Replied
              </button>
            )}
            {contact.status !== 'archived' && (
              <button
                onClick={() => onUpdateStatus(contact.id, 'archived')}
                disabled={actionLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              >
                <Archive className="w-3.5 h-3.5" />
                Archive
              </button>
            )}
            <button
              onClick={() => onDelete(contact.id, contact.name)}
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

function ContactDetails({
  contact,
  onUpdateStatus,
}: {
  contact: ContactSubmission;
  onUpdateStatus: (id: string, status: string) => void;
}) {
  const meta = [
    { label: 'Email', value: contact.email },
    { label: 'Phone', value: contact.phone || '---' },
    { label: 'Company', value: contact.company || '---' },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {meta.map((d) => (
          <div key={d.label}>
            <dt className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              {d.label}
            </dt>
            <dd className="text-sm text-gray-900 mt-0.5">{d.value}</dd>
          </div>
        ))}
      </div>

      <div>
        <dt className="text-xs font-medium text-gray-400 uppercase tracking-wide">Message</dt>
        <dd className="text-sm text-gray-900 mt-0.5 whitespace-pre-wrap bg-white rounded-lg border border-gray-200 p-3">
          {contact.message}
        </dd>
      </div>

      {/* Status quick-update */}
      <div className="flex items-center gap-2 pt-2">
        <span className="text-xs text-gray-400 mr-1">Set status:</span>
        {(['new', 'read', 'replied', 'archived'] as const).map((s) => (
          <button
            key={s}
            onClick={() => onUpdateStatus(contact.id, s)}
            disabled={contact.status === s}
            className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize transition-colors ${
              contact.status === s
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
