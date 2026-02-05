"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { format } from "date-fns"
import SystemHealth from "@/components/dashboard/SystemHealth"
import { 
  Users, 
  Building2, 
  CreditCard, 
  Activity, 
  Package, 
  Eye,
  Clock,
  AlertCircle,
  CheckCircle2,
  TrendingUp
} from "lucide-react"

type RecentChange = { business: { name: string }; status: string; updatedAt: string }
type DashboardStats = {
  userCount: number
  totalBusinessCount: number
  activeSubscriptions: number
  activelyMonitoringBusinessCount: number
  totalOfferCount: number
  actuallyMonitoredOfferCount: number
  activeBusinessCount: number
  trialBusinessCount: number
  inactiveBusinessCount: number
  recentSubscriptionChanges: RecentChange[]
}
type SystemHealth = { status: string; database: string; timestamp: string }

const statusConfig: Record<string, { bg: string; text: string; border: string; icon: React.ElementType }> = {
  ACTIVE: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", icon: CheckCircle2 },
  TRIAL: { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200", icon: Clock },
  PAST_DUE: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", icon: AlertCircle },
  CANCELLED: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", icon: AlertCircle },
  EXPIRED: { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200", icon: AlertCircle },
}

const StatusBadge = ({ status }: { status: string }) => {
  const config = statusConfig[status] || statusConfig.EXPIRED
  const Icon = config.icon
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${config.bg} ${config.text} ${config.border}`}>
      <Icon size={12} />
      {status}
    </span>
  )
}

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [health, setHealth] = useState<SystemHealth | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
  }, [status, router])

  useEffect(() => {
    const load = async () => {
      try {
        const [s, h] = await Promise.all([fetch("/api/dashboard/stats"), fetch("/api/health")])
        if (!s.ok || !h.ok) throw new Error("bad response")
        const sj = await s.json()
        const hj = await h.json()
        setStats(sj.stats)
        setHealth(hj)
      } catch (e) {
        setErr("Failed to load dashboard data")
      } finally {
        setLoading(false)
      }
    }
    if (session) load()
  }, [session])

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    )
  }
  if (!session) return null

  const statCards = [
    { label: "Users", value: stats?.userCount, icon: Users, color: "violet" },
    { label: "Businesses", value: stats?.totalBusinessCount, icon: Building2, color: "blue" },
    { label: "Active Subs", value: stats?.activeSubscriptions, icon: CreditCard, color: "emerald" },
    { label: "Monitoring", value: stats?.activelyMonitoringBusinessCount, icon: Activity, color: "amber" },
    { label: "Total Offers", value: stats?.totalOfferCount, icon: Package, color: "slate" },
    { label: "Monitored", value: stats?.actuallyMonitoredOfferCount, icon: Eye, color: "cyan" },
    { label: "Trials", value: stats?.trialBusinessCount, icon: Clock, color: "purple" },
    { label: "Inactive", value: stats?.inactiveBusinessCount, icon: AlertCircle, color: "red" },
  ]

  const colorMap: Record<string, string> = {
    violet: "bg-violet-100 text-violet-600",
    blue: "bg-blue-100 text-blue-600",
    emerald: "bg-emerald-100 text-emerald-600",
    amber: "bg-amber-100 text-amber-600",
    slate: "bg-slate-100 text-slate-600",
    cyan: "bg-cyan-100 text-cyan-600",
    purple: "bg-purple-100 text-purple-600",
    red: "bg-red-100 text-red-600",
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-violet-700 rounded-xl flex items-center justify-center">
              <TrendingUp size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                {health?.timestamp && (
                  <span>{format(new Date(health.timestamp), "MMM d, HH:mm")}</span>
                )}
                <span>·</span>
                <span className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${health?.database === "connected" ? "bg-emerald-500" : "bg-red-500"}`} />
                  {health?.database === "connected" ? "Connected" : "Disconnected"}
                </span>
              </div>
            </div>
          </div>
        </header>

        {err && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
            <AlertCircle size={16} />
            {err}
          </div>
        )}

        {/* Stats Grid */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {statCards.map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md hover:border-gray-200 transition-all"
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${colorMap[stat.color]}`}>
                <stat.icon size={18} />
              </div>
              <div className="text-2xl font-semibold text-gray-900">
                {stat.value !== undefined ? stat.value.toLocaleString() : "—"}
              </div>
              <div className="text-sm text-gray-500">{stat.label}</div>
            </div>
          ))}
        </section>

        {/* Recent Activity */}
        <section className="bg-white rounded-xl border border-gray-100">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Recent Subscription Changes</h2>
          </div>
          {(!stats?.recentSubscriptionChanges || stats.recentSubscriptionChanges.length === 0) ? (
            <div className="px-5 py-8 text-center text-gray-500 text-sm">
              No recent activity
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {stats.recentSubscriptionChanges.slice(0, 8).map((r, i) => (
                <li key={i} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50/50 transition-colors">
                  <div className="min-w-0">
                    <div className="font-medium text-gray-900 truncate">{r.business.name}</div>
                    <div className="text-xs text-gray-500">{format(new Date(r.updatedAt), "MMM d, HH:mm")}</div>
                  </div>
                  <StatusBadge status={r.status} />
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* System Health */}
        <section>
          <SystemHealth />
        </section>
      </main>
    </div>
  )
}