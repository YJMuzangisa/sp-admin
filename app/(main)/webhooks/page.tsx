// app/(main)/webhooks/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import { RefreshCw, RotateCcw, CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react';

interface WebhookLog {
  id: string;
  createdAt: string;
  event: string;
  reference: string | null;
  businessId: string | null;
  status: 'PENDING' | 'PROCESSED' | 'FAILED';
  error: string | null;
  processedAt: string | null;
  retryCount: number;
}

const STATUS_CONFIG = {
  PROCESSED: { color: 'bg-green-50 text-green-700', icon: CheckCircle2, iconColor: 'text-green-500' },
  FAILED:    { color: 'bg-red-50 text-red-700',   icon: XCircle,       iconColor: 'text-red-500'   },
  PENDING:   { color: 'bg-amber-50 text-amber-700', icon: Clock,        iconColor: 'text-amber-500' },
};

export default function WebhooksPage() {
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [retrying, setRetrying] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/webhooks?status=${statusFilter}&limit=100`);
      const data = await res.json();
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, [statusFilter]);

  const handleRetry = async (logId: string) => {
    setRetrying(logId);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logId }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: 'Webhook replayed successfully.' });
        fetchLogs();
      } else {
        setMessage({ type: 'error', text: data.error || 'Retry failed.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error.' });
    } finally {
      setRetrying(null);
    }
  };

  const failed = logs.filter(l => l.status === 'FAILED').length;
  const processed = logs.filter(l => l.status === 'PROCESSED').length;
  const pending = logs.filter(l => l.status === 'PENDING').length;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Webhook Logs</h1>
            <p className="text-sm text-gray-500 mt-1">Monitor and retry Paystack webhook events</p>
          </div>
          <button
            onClick={fetchLogs}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 px-4 py-3 rounded-xl text-sm font-medium ${
            message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {message.text}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 size={15} className="text-green-500" />
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Processed</span>
            </div>
            <div className="text-3xl font-extrabold text-gray-900">{processed}</div>
          </div>
          <div className="bg-red-50 rounded-2xl border border-red-100 p-5">
            <div className="flex items-center gap-2 mb-2">
              <XCircle size={15} className="text-red-500" />
              <span className="text-xs font-semibold text-red-400 uppercase tracking-wider">Failed</span>
            </div>
            <div className="text-3xl font-extrabold text-red-700">{failed}</div>
          </div>
          <div className="bg-amber-50 rounded-2xl border border-amber-100 p-5">
            <div className="flex items-center gap-2 mb-2">
              <Clock size={15} className="text-amber-500" />
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Pending</span>
            </div>
            <div className="text-3xl font-extrabold text-amber-700">{pending}</div>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-5">
          {['all', 'FAILED', 'PROCESSED', 'PENDING'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                statusFilter === s
                  ? 'bg-gray-950 text-white border-gray-950'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {s === 'all' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="py-16 text-center text-sm text-gray-400">Loading...</div>
          ) : logs.length === 0 ? (
            <div className="py-16 text-center text-sm text-gray-400">No webhook logs yet.</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Event</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Reference</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Error</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Received</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Retries</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => {
                  const config = STATUS_CONFIG[log.status];
                  const Icon = config.icon;
                  return (
                    <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4">
                        <span className="text-sm font-mono font-medium text-gray-900">{log.event}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs font-mono text-gray-500 truncate block max-w-[180px]">
                          {log.reference || '—'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${config.color}`}>
                          <Icon size={11} />
                          {log.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 max-w-xs">
                        {log.error
                          ? <span className="text-xs text-red-600 truncate block">{log.error}</span>
                          : <span className="text-gray-300 text-sm">—</span>
                        }
                      </td>
                      <td className="px-5 py-4 text-xs text-gray-400 whitespace-nowrap">
                        {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                      </td>
                      <td className="px-5 py-4 text-xs text-gray-400">
                        {log.retryCount > 0
                          ? <span className="font-semibold text-amber-600">{log.retryCount}x</span>
                          : '—'
                        }
                      </td>
                      <td className="px-5 py-4">
                        {log.status === 'FAILED' && (
                          <button
                            onClick={() => handleRetry(log.id)}
                            disabled={retrying === log.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-950 text-white text-xs font-semibold rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
                          >
                            <RotateCcw size={11} className={retrying === log.id ? 'animate-spin' : ''} />
                            {retrying === log.id ? 'Retrying...' : 'Retry'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  );
}