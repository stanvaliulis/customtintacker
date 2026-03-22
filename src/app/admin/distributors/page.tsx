'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  Trash2,
  ChevronDown,
  ChevronUp,
  Globe,
  Mail,
  Phone,
  Building2,
  FileText,
  Inbox,
} from 'lucide-react';

interface DistributorApplication {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  website: string;
  asiNumber: string;
  sageNumber: string;
  ppaiNumber: string;
  estimatedVolume: string;
  primaryIndustry: string;
  referralSource: string;
  additionalNotes: string;
  agreeTerms: boolean;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
}

type FilterTab = 'all' | 'pending' | 'approved' | 'rejected';

function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days !== 1 ? 's' : ''} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months !== 1 ? 's' : ''} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years !== 1 ? 's' : ''} ago`;
}

export default function DistributorsPage() {
  const [applications, setApplications] = useState<DistributorApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    fetch('/api/admin/distributors')
      .then((r) => r.json())
      .then((data) => {
        setApplications(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleStatusChange(id: string, status: 'approved' | 'rejected') {
    try {
      const res = await fetch(`/api/admin/distributors/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) throw new Error('Failed to update');

      const updated = await res.json();
      setApplications((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: updated.status } : a))
      );
      showToast(
        `Application ${status === 'approved' ? 'approved' : 'rejected'} successfully`
      );
    } catch {
      showToast('Failed to update application status', 'error');
    }
  }

  async function handleDelete(id: string, companyName: string) {
    if (!confirm(`Delete application from "${companyName}"? This cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/admin/distributors/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setApplications((prev) => prev.filter((a) => a.id !== id));
      showToast('Application deleted');
    } catch {
      showToast('Failed to delete application', 'error');
    }
  }

  const filtered =
    activeTab === 'all'
      ? applications
      : applications.filter((a) => a.status === activeTab);

  const pendingCount = applications.filter((a) => a.status === 'pending').length;

  const tabs: { key: FilterTab; label: string; count?: number }[] = [
    { key: 'all', label: 'All', count: applications.length },
    { key: 'pending', label: 'Pending', count: pendingCount },
    { key: 'approved', label: 'Approved', count: applications.filter((a) => a.status === 'approved').length },
    { key: 'rejected', label: 'Rejected', count: applications.filter((a) => a.status === 'rejected').length },
  ];

  function StatusBadge({ status }: { status: string }) {
    const styles = {
      pending: 'bg-amber-50 text-amber-700 border-amber-200',
      approved: 'bg-green-50 text-green-700 border-green-200',
      rejected: 'bg-red-50 text-red-700 border-red-200',
    };
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
          styles[status as keyof typeof styles] || styles.pending
        }`}
      >
        {status === 'pending' && <Clock className="w-3 h-3" />}
        {status === 'approved' && <CheckCircle2 className="w-3 h-3" />}
        {status === 'rejected' && <XCircle className="w-3 h-3" />}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  }

  return (
    <div className="p-8">
      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white transition-all ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Page header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
          <Users className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">Distributor Applications</h1>
            {pendingCount > 0 && (
              <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                {pendingCount} pending
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            Review and manage distributor partnership applications
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={`ml-1.5 text-xs ${
                  activeTab === tab.key ? 'text-gray-500' : 'text-gray-400'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading applications...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Inbox className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No applications</h3>
          <p className="text-sm text-gray-500">
            {activeTab === 'all'
              ? 'No distributor applications have been submitted yet.'
              : `No ${activeTab} applications found.`}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((app) => {
            const isExpanded = expandedId === app.id;
            return (
              <div
                key={app.id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-gray-900 truncate">
                        {app.companyName}
                      </h3>
                      <p className="text-sm text-gray-500 mt-0.5">{app.contactName}</p>
                    </div>
                    <StatusBadge status={app.status} />
                  </div>

                  {/* Contact info */}
                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{app.email}</span>
                    </div>
                    {app.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span>{app.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Industry badges */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {app.asiNumber && (
                      <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        ASI: {app.asiNumber}
                      </span>
                    )}
                    {app.sageNumber && (
                      <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        SAGE: {app.sageNumber}
                      </span>
                    )}
                    {app.ppaiNumber && (
                      <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-green-50 text-green-700 border border-green-200">
                        PPAI: {app.ppaiNumber}
                      </span>
                    )}
                  </div>

                  {/* Meta info */}
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                    <div className="flex items-center gap-3">
                      {app.estimatedVolume && (
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {app.estimatedVolume}/mo
                        </span>
                      )}
                      {app.primaryIndustry && (
                        <span className="truncate max-w-[120px]">{app.primaryIndustry}</span>
                      )}
                    </div>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {timeAgo(app.submittedAt)}
                    </span>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="mb-4 pt-3 border-t border-gray-100 space-y-3">
                      {app.website && (
                        <div className="flex items-start gap-2 text-sm">
                          <Globe className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                          <a
                            href={app.website.startsWith('http') ? app.website : `https://${app.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline break-all"
                          >
                            {app.website}
                          </a>
                        </div>
                      )}
                      {app.referralSource && (
                        <div className="flex items-start gap-2 text-sm">
                          <FileText className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-0.5">
                              Referral Source
                            </p>
                            <p className="text-gray-700">{app.referralSource}</p>
                          </div>
                        </div>
                      )}
                      {app.additionalNotes && (
                        <div>
                          <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">
                            Additional Notes
                          </p>
                          <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
                            {app.additionalNotes}
                          </p>
                        </div>
                      )}
                      <div className="text-xs text-gray-400">
                        Applied: {new Date(app.submittedAt).toLocaleString()}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {app.status !== 'approved' && (
                      <button
                        onClick={() => handleStatusChange(app.id, 'approved')}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Approve
                      </button>
                    )}
                    {app.status !== 'rejected' && (
                      <button
                        onClick={() => handleStatusChange(app.id, 'rejected')}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Reject
                      </button>
                    )}
                    <button
                      onClick={() =>
                        setExpandedId(isExpanded ? null : app.id)
                      }
                      className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-medium bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200 transition-colors"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="w-3.5 h-3.5" />
                          Less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3.5 h-3.5" />
                          Details
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(app.id, app.companyName)}
                      className="inline-flex items-center justify-center p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Delete application"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
