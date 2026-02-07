'use client'

import { useState, useEffect } from 'react'
import { 
  Activity, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  Cpu,
  HardDrive,
  Clock,
  Zap,
  Users
} from 'lucide-react'

type RecentCycle = {
  business: string
  cycle: number
  highPriority: number
  lowPriority: number
  total: number
}

type SystemHealthData = {
  status: string
  timestamp: string
  serviceStatus: string
  rateLimitErrors: number
  timeoutErrors: number
  pendingJobs: number
  pendingJobsWarning: boolean
  completedJobs: {
    buybox: number
    sync: number
  }
  recentCycles: RecentCycle[]
  errorCount: number
  recentErrors: string[]
  resources: {
    cpu: string
    memory: string
    uptime: string
  }
  queueStats: {
    queuedJobs: number
    queueCapacity: number
    activeWorkers: number
    workerCount: number
    totalProcessed: number
    totalFailed: number
    successRate: string
  }
}

export default function SystemHealth() {
  const [health, setHealth] = useState<SystemHealthData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchHealth = async () => {
    try {
      setRefreshing(true)
      const res = await fetch('/api/system-health')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setHealth(data)
      setError(null)
    } catch (e) {
      setError('Unable to connect to processor')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchHealth()
    const interval = setInterval(fetchHealth, 3600000) // Refresh every hour
    return () => clearInterval(interval)
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'RUNNING':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />
      case 'DEGRADED':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />
      case 'STOPPED':
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return <Activity className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RUNNING':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'DEGRADED':
        return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'STOPPED':
        return 'bg-red-50 text-red-700 border-red-200'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-violet-100 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-violet-600" />
            </div>
            <h2 className="font-semibold text-gray-900">System Health</h2>
          </div>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (error || !health) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <h2 className="font-semibold text-gray-900">System Health</h2>
          </div>
          <button
            onClick={fetchHealth}
            disabled={refreshing}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 text-gray-500 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <div className="text-center py-6 text-gray-500 text-sm">
          {error || 'Unable to load health data'}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-violet-100 rounded-lg flex items-center justify-center">
            <Activity className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">System Health</h2>
            <p className="text-xs text-gray-500">Buybox Processor</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${getStatusColor(health.status)}`}>
            {getStatusIcon(health.status)}
            {health.status}
          </span>
          <button
            onClick={fetchHealth}
            disabled={refreshing}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 text-gray-500 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Resources Row */}
      <div className="grid grid-cols-3 gap-4 p-4 border-b border-gray-50">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600">CPU:</span>
          <span className="text-sm font-medium text-gray-900">{health.resources.cpu}%</span>
        </div>
        <div className="flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600">Memory:</span>
          <span className="text-sm font-medium text-gray-900">{health.resources.memory}%</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600">Uptime:</span>
          <span className="text-sm font-medium text-gray-900">{health.resources.uptime}</span>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-2 p-4 border-b border-gray-50">
        <div className="text-center">
          <div className={`text-lg font-semibold ${health.rateLimitErrors > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
            {health.rateLimitErrors}
          </div>
          <div className="text-xs text-gray-500">Rate Limits</div>
        </div>
        <div className="text-center">
          <div className={`text-lg font-semibold ${health.timeoutErrors > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
            {health.timeoutErrors}
          </div>
          <div className="text-xs text-gray-500">Timeouts</div>
        </div>
        <div className="text-center">
          <div className={`text-lg font-semibold ${health.pendingJobsWarning ? 'text-amber-600' : 'text-gray-900'}`}>
            {health.pendingJobs}
          </div>
          <div className="text-xs text-gray-500">Pending</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900">
            {health.queueStats.successRate}%
          </div>
          <div className="text-xs text-gray-500">Success</div>
        </div>
      </div>

      {/* Completed Jobs */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-violet-500" />
          <span className="text-sm text-gray-600">Completed (30m):</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-gray-900">
            <span className="font-medium">{health.completedJobs.buybox}</span> buybox
          </span>
          <span className="text-gray-400">•</span>
          <span className="text-gray-900">
            <span className="font-medium">{health.completedJobs.sync}</span> sync
          </span>
        </div>
      </div>

      {/* Recent Cycles */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">Recent Cycles</span>
        </div>
        {health.recentCycles.length === 0 ? (
          <div className="text-sm text-gray-500 text-center py-2">No recent cycles</div>
        ) : (
          <div className="space-y-1.5">
            {health.recentCycles.slice(0, 5).map((cycle, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-gray-700 truncate max-w-[120px]" title={cycle.business}>
                  {cycle.business}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-xs">cycle {cycle.cycle}</span>
                  <span className="font-medium text-gray-900">{cycle.total} offers</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Errors (if any) */}
      {health.recentErrors.length > 0 && (
        <div className="p-4 border-t border-gray-100 bg-red-50/50">
          <div className="text-xs font-medium text-red-700 mb-2">Recent Errors</div>
          <div className="space-y-1">
            {health.recentErrors.slice(0, 3).map((err, i) => (
              <div key={i} className="text-xs text-red-600 truncate" title={err}>
                {err}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}