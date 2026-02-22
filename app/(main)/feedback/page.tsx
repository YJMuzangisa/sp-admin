// app/(main)/feedback/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { MessageSquare, TrendingUp, Star, Calendar, Search } from 'lucide-react';

interface FeedbackEntry {
  id: string;
  category: string;
  message: string;
  createdAt: string;
  business: {
    name: string;
    owner: { name: string | null; email: string };
  };
}

interface FeatureStat {
  id: string;
  label: string;
  count: number;
}

interface Stats {
  total: number;
  featureRequestCount: number;
  npsAvg: number;
  npsScore: number;
  promoters: number;
  passives: number;
  detractors: number;
  npsTotal: number;
  thisMonth: number;
  featureStats: FeatureStat[];
}

const CATEGORY_STYLES: Record<string, string> = {
  'NPS Survey': 'bg-green-50 text-green-700',
  'Feature Request Survey': 'bg-violet-50 text-violet-700',
  'General': 'bg-blue-50 text-blue-700',
  'Bug Report': 'bg-red-50 text-red-700',
  'Pricing': 'bg-amber-50 text-amber-700',
};

export default function FeedbackPage() {
  const [feedback, setFeedback] = useState<FeedbackEntry[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [days, setDays] = useState('0');

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ category, days, search });
      const res = await fetch('/api/feedback?' + params.toString());
      const data = await res.json();
      setFeedback(data.feedback || []);
      setStats(data.stats || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, [category, days]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(fetchFeedback, 300);
    return () => clearTimeout(t);
  }, [search]);

  const maxFeatureCount = stats?.featureStats[0]?.count || 1;

  const npsPromoterPct = stats && stats.npsTotal > 0
    ? Math.round((stats.promoters / stats.npsTotal) * 100) : 0;
  const npsPassivePct = stats && stats.npsTotal > 0
    ? Math.round((stats.passives / stats.npsTotal) * 100) : 0;
  const npsDetractorPct = stats && stats.npsTotal > 0
    ? Math.round((stats.detractors / stats.npsTotal) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Feedback</h1>
          <p className="text-sm text-gray-500 mt-1">Survey responses, feature requests and user feedback</p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg bg-gray-100">
                <MessageSquare size={14} className="text-gray-500" />
              </div>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total</span>
            </div>
            <div className="text-3xl font-extrabold text-gray-900 tracking-tight">{stats?.total ?? '—'}</div>
            <div className="text-xs text-gray-400 mt-1">All time</div>
          </div>

          <div className="bg-violet-50 rounded-2xl border border-violet-100 p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg bg-violet-100">
                <Star size={14} className="text-violet-600" />
              </div>
              <span className="text-xs font-semibold text-violet-400 uppercase tracking-wider">Feature Requests</span>
            </div>
            <div className="text-3xl font-extrabold text-violet-700 tracking-tight">{stats?.featureRequestCount ?? '—'}</div>
            <div className="text-xs text-violet-400 mt-1">From surveys</div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg bg-gray-100">
                <TrendingUp size={14} className="text-gray-500" />
              </div>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Avg NPS Score</span>
            </div>
            <div className="text-3xl font-extrabold text-gray-900 tracking-tight">{stats?.npsAvg ?? '—'}</div>
            <div className="text-xs text-gray-400 mt-1">Out of 10</div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg bg-gray-100">
                <Calendar size={14} className="text-gray-500" />
              </div>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">This Month</span>
            </div>
            <div className="text-3xl font-extrabold text-gray-900 tracking-tight">{stats?.thisMonth ?? '—'}</div>
            <div className="text-xs text-gray-400 mt-1">Responses</div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-2 gap-4 mb-6">

          {/* Feature requests */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-sm font-bold text-gray-900 mb-5 tracking-tight">Most requested features</h2>
            {stats?.featureStats && stats.featureStats.length > 0 ? (
              <div className="space-y-3">
                {stats.featureStats.map(feat => (
                  <div key={feat.id} className="flex items-center gap-3">
                    <span className="text-xs text-gray-600 font-medium w-36 shrink-0">{feat.label}</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-violet-500 rounded-full"
                        style={{ width: `${(feat.count / maxFeatureCount) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-gray-900 w-6 text-right">{feat.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No feature requests yet.</p>
            )}
          </div>

          {/* NPS breakdown */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-sm font-bold text-gray-900 mb-5 tracking-tight">NPS breakdown</h2>
            {stats && stats.npsTotal > 0 ? (
              <div className="flex items-center gap-8">
                <div>
                  <div className="text-5xl font-black text-gray-900 tracking-tighter leading-none">
                    {stats.npsScore}
                  </div>
                  <div className="text-xs text-gray-400 mt-1.5">NPS Score</div>
                </div>
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-green-600 w-20">Promoters</span>
                    <div className="flex-1 h-1.5 bg-green-100 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: `${npsPromoterPct}%` }} />
                    </div>
                    <span className="text-xs text-gray-400 w-8 text-right">{npsPromoterPct}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-amber-600 w-20">Passives</span>
                    <div className="flex-1 h-1.5 bg-amber-100 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full" style={{ width: `${npsPassivePct}%` }} />
                    </div>
                    <span className="text-xs text-gray-400 w-8 text-right">{npsPassivePct}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-red-600 w-20">Detractors</span>
                    <div className="flex-1 h-1.5 bg-red-100 rounded-full overflow-hidden">
                      <div className="h-full bg-red-500 rounded-full" style={{ width: `${npsDetractorPct}%` }} />
                    </div>
                    <span className="text-xs text-gray-400 w-8 text-right">{npsDetractorPct}%</span>
                  </div>
                  <p className="text-xs text-gray-400 pt-1">
                    NPS = % Promoters − % Detractors &nbsp;·&nbsp; Industry avg ~30
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400">No NPS responses yet.</p>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search business or message..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-violet-400"
            />
          </div>
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 outline-none focus:border-violet-400"
          >
            <option value="all">All categories</option>
            <option value="NPS Survey">NPS Survey</option>
            <option value="Feature Request Survey">Feature Request Survey</option>
            <option value="General">General</option>
            <option value="Bug Report">Bug Report</option>
          </select>
          <select
            value={days}
            onChange={e => setDays(e.target.value)}
            className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 outline-none focus:border-violet-400"
          >
            <option value="0">All time</option>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Business</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Category</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Message</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center text-sm text-gray-400">Loading...</td>
                </tr>
              ) : feedback.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center text-sm text-gray-400">No feedback found.</td>
                </tr>
              ) : (
                feedback.map(entry => (
                  <tr key={entry.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-gray-900 text-sm">{entry.business.name}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{entry.business.owner.email}</div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${CATEGORY_STYLES[entry.category] || 'bg-gray-100 text-gray-600'}`}>
                        {entry.category}
                      </span>
                    </td>
                    <td className="px-5 py-4 max-w-xs">
                      <p className="text-sm text-gray-600 leading-relaxed">{entry.message}</p>
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-400 whitespace-nowrap">
                      {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}