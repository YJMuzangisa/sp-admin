'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldOff,
  Inbox,
} from 'lucide-react';

type WebhookLog = {
  id: string;
  createdAt: string;
  event: string;
  reference: string | null;
  businessId: string | null;
  businessName?: string;
  status: string;
  error: string | null;
  processedAt: string | null;
  retryCount: number;
};

const statusConfig: Record<string, { icon: React.ElementType; bg: string; text: string; label: string }> = {
  RECEIVED: { icon: Inbox, bg: 'bg-blue-50', text: 'text-blue-700', label: 'Received' },
  PENDING: { icon: Clock, bg: 'bg-amber-50', text: 'text-amber-700', label: 'Pending' },
  PROCESSED: { icon: CheckCircle2, bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Processed' },
  FAILED: { icon: XCircle, bg: 'bg-red-50', text: 'text-red-700', label: 'Failed' },
  SIGNATURE_FAILED: { icon: ShieldAlert, bg: 'bg-red-50', text: 'text-red-700', label: 'Sig Failed' },
  SIGNATURE_MISSING: { icon: ShieldOff, bg: 'bg-orange-50', text: 'text-orange-700', label: 'No Sig' },
};

const defaultStatusConfig = { icon: AlertTriangle, bg: 'bg-gray-50', text: 'text-gray-700', label: 'Unknown' };

export default function WebhooksPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [retrying, setRetrying] = useState<string | null>(null);

  useEffect(() => {
    if (authStatus === 'unauthenticated') router.push('/login');
  }, [authStatus, router]);

  useEffect(() => {
    fetchLogs();
  }, [filter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'ALL') params.set('status', filter);
      const res = await fetch(`/api/admin/webhooks?${params}`);
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (err) {
      console.error('Failed to fetch webhook logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async (logId: string) => {
    setRetrying(logId);
    try {
      const res = await fetch('/api/admin/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logId }),
      });
      if (res.ok) {
        await fetchLogs();
      } else {
        console.error('Retry failed');
      }
    } catch (err) {
      console.error('Retry error:', err);
    } finally {
      setRetrying(null);
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      log.event?.toLowerCase().includes(s) ||
      log.reference?.toLowerCase().includes(s) ||
      log.businessName?.toLowerCase().includes(s) ||
      log.error?.toLowerCase().includes(s)
    );
  });

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' });
  };

  if (authStatus === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    );
  }

  const statusCounts = logs.reduce(
    (acc, log) => {
      acc[log.status] = (acc[log.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Webhook Logs</h1>
        <button
          onClick={fetchLogs}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {Object.entries(statusConfig).map(([key, config]) => {
          const Icon = config.icon;
          const count = statusCounts[key] || 0;
          return (
            <button
              key={key}
              onClick={() => setFilter(filter === key ? 'ALL' : key)}
              className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${
                filter === key
                  ? 'border-violet-300 bg-violet-50 ring-2 ring-violet-200'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <Icon className={`h-4 w-4 ${config.text}`} />
              <div className="text-left">
                <p className="text-xs text-gray-500">{config.label}</p>
                <p className="text-lg font-semibold text-gray-900">{count}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by event, reference, business, or error..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-200"
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Time</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Event</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Reference</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Business</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Error</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                    {search ? 'No matching webhooks found' : 'No webhook logs yet'}
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const config = statusConfig[log.status] || defaultStatusConfig;
                  const Icon = config.icon;
                  return (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {formatDate(log.createdAt)}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-800">
                        {log.event}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-600 max-w-[200px] truncate">
                        {log.reference || '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {log.businessName || log.businessId || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
                        >
                          <Icon className="h-3 w-3" />
                          {config.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-red-600 text-xs max-w-[250px] truncate">
                        {log.error || '—'}
                      </td>
                      <td className="px-4 py-3">
                        {(log.status === 'FAILED' || log.status === 'SIGNATURE_FAILED') && (
                          <button
                            onClick={() => handleRetry(log.id)}
                            disabled={retrying === log.id}
                            className="flex items-center gap-1 px-3 py-1 text-xs bg-violet-100 text-violet-700 rounded-lg hover:bg-violet-200 disabled:opacity-50"
                          >
                            <RefreshCw
                              className={`h-3 w-3 ${retrying === log.id ? 'animate-spin' : ''}`}
                            />
                            Retry
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}