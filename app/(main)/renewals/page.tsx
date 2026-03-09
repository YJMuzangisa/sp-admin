'use client';

import { useEffect, useState } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import { CalendarClock, XCircle, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

interface UpcomingRenewal {
  businessId: string;
  businessName: string;
  subscriptionId: string;
  status: string;
  planName: string;
  planPrice: number;
  nextBillingDate: string;
  lastPaymentDate: string | null;
  paystackSubscriptionCode: string | null;
  paystackCustomerCode: string | null;
}

export default function RenewalsPage() {
  const [renewals, setRenewals] = useState<UpcomingRenewal[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchRenewals = async () => {
    try {
      const res = await fetch('/api/admin/renewals');
      const data = await res.json();
      if (res.ok) {
        setRenewals(data.upcoming);
      } else {
        setError(data.error || 'Failed to fetch');
      }
    } catch (err) {
      setError('Failed to fetch upcoming renewals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRenewals();
  }, []);

  const handleCancel = async (renewal: UpcomingRenewal) => {
    if (!confirm(`Cancel subscription for ${renewal.businessName}? This will stop Paystack from charging them.`)) {
      return;
    }

    setCancelling(renewal.subscriptionId);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/admin/renewals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionCode: renewal.paystackSubscriptionCode,
          subscriptionId: renewal.subscriptionId,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(`Cancelled: ${renewal.businessName}`);
        setRenewals((prev) => prev.filter((r) => r.subscriptionId !== renewal.subscriptionId));
      } else {
        setError(data.error || 'Failed to cancel');
      }
    } catch (err) {
      setError('Failed to cancel subscription');
    } finally {
      setCancelling(null);
    }
  };

  const handleConfirm = (subscriptionId: string) => {
    setConfirmed((prev) => new Set([...prev, subscriptionId]));
  };

  const getDaysUntil = (dateStr: string) => {
    const now = new Date();
    const billing = new Date(dateStr);
    const diffMs = billing.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 24) return `${diffHours}h`;
    return `${Math.floor(diffHours / 24)}d ${diffHours % 24}h`;
  };

  const getUrgencyColor = (dateStr: string) => {
    const now = new Date();
    const billing = new Date(dateStr);
    const diffHours = (billing.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (diffHours < 12) return 'bg-red-50 border-red-200';
    if (diffHours < 24) return 'bg-amber-50 border-amber-200';
    return 'bg-white border-gray-200';
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <CalendarClock className="h-7 w-7 text-violet-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Upcoming Renewals</h1>
            <p className="text-sm text-gray-500">Subscriptions billing within the next 3 days</p>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            {successMsg}
          </div>
        )}

        {/* Empty state */}
        {renewals.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <CheckCircle2 className="h-12 w-12 text-green-400 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No upcoming renewals in the next 3 days</p>
            <p className="text-sm text-gray-400 mt-1">All clear — nothing to review</p>
          </div>
        )}

        {/* Renewals list */}
        {renewals.length > 0 && (
          <div className="space-y-3">
            {renewals.map((renewal) => {
              const isConfirmed = confirmed.has(renewal.subscriptionId);
              const isCancelling = cancelling === renewal.subscriptionId;

              return (
                <div
                  key={renewal.subscriptionId}
                  className={`rounded-xl border p-5 transition-all ${getUrgencyColor(renewal.nextBillingDate)} ${
                    isConfirmed ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    {/* Left: Business info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-gray-900 truncate">
                          {renewal.businessName}
                        </h3>
                        {isConfirmed && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                            <CheckCircle2 className="h-3 w-3" />
                            Reviewed
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                        <span className="font-medium text-gray-700">
                          R{renewal.planPrice.toFixed(2)}
                        </span>
                        <span>{renewal.planName}</span>
                        <span>
                          Billing: {format(new Date(renewal.nextBillingDate), 'MMM d, HH:mm')}
                        </span>
                        <span className="text-xs">
                          ({getDaysUntil(renewal.nextBillingDate)} away)
                        </span>
                      </div>
                      {renewal.lastPaymentDate && (
                        <p className="mt-1 text-xs text-gray-400">
                          Last paid: {formatDistanceToNow(new Date(renewal.lastPaymentDate), { addSuffix: true })}
                        </p>
                      )}
                      {renewal.paystackSubscriptionCode && (
                        <p className="mt-0.5 text-xs text-gray-300 font-mono">
                          {renewal.paystackSubscriptionCode}
                        </p>
                      )}
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 ml-4">
                      {!isConfirmed && (
                        <button
                          onClick={() => handleConfirm(renewal.subscriptionId)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Approve
                        </button>
                      )}
                      <button
                        onClick={() => handleCancel(renewal)}
                        disabled={isCancelling}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors"
                      >
                        {isCancelling ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                        {isCancelling ? 'Cancelling...' : 'Cancel'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Summary */}
        {renewals.length > 0 && (
          <div className="mt-6 p-4 bg-white rounded-xl border border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">
                {renewals.length} renewal{renewals.length !== 1 ? 's' : ''} upcoming
              </span>
              <span className="font-semibold text-gray-900">
                Total: R{renewals.reduce((sum, r) => sum + r.planPrice, 0).toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}