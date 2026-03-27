import { useState } from 'react'
import { generateDashboards } from '../api'

export default function ConfirmScreen({ intent, onConfirm, onEdit }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleConfirm = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await generateDashboards(intent)
      onConfirm(res.data.dashboards)
    } catch (e) {
      setError('Failed to generate dashboards. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-xl">

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-1">
            Here's what I <span className="text-indigo-400">understood</span>
          </h2>
          <p className="text-white/40 text-sm">Confirm before generating dashboards</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm mb-4">

          {/* Summary */}
          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 mb-5">
            <p className="text-white/40 text-xs mb-1 uppercase tracking-wider">Summary</p>
            <p className="text-white/80 text-sm">{intent?.summary}</p>
          </div>

          {/* KPI list */}
          <div className="mb-5">
            <p className="text-white/40 text-xs mb-3 uppercase tracking-wider">
              KPIs detected — {intent?.kpis?.length || 0}
            </p>
            <div className="space-y-2">
              {intent?.kpis?.map((kpi, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3"
                >
                  <div>
                    <p className="text-sm text-white font-medium">{kpi.name}</p>
                    <p className="text-xs text-white/40">
                      {kpi.aggregation}({kpi.metric_column}) by {kpi.group_by_column}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full border ${
                    kpi.chart_type === 'bar'
                      ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-300'
                      : kpi.chart_type === 'line'
                      ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                      : 'bg-amber-500/20 border-amber-500/30 text-amber-300'
                  }`}>
                    {kpi.chart_type}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Filters if any */}
          {(intent?.time_filter || intent?.status_filter) && (
            <div className="mb-5">
              <p className="text-white/40 text-xs mb-2 uppercase tracking-wider">Filters</p>
              <div className="flex gap-2 flex-wrap">
                {intent.time_filter && (
                  <span className="bg-white/10 rounded-full px-3 py-1 text-xs text-white/70">
                    Year: {intent.time_filter}
                  </span>
                )}
                {intent.status_filter && (
                  <span className="bg-white/10 rounded-full px-3 py-1 text-xs text-white/70">
                    Status: {intent.status_filter}
                  </span>
                )}
              </div>
            </div>
          )}

          {error && <p className="text-red-400 text-xs mb-3">{error}</p>}

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onEdit}
              className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl py-3 text-sm text-white/70 transition-all"
            >
              Edit intent
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 rounded-xl py-3 text-sm font-semibold transition-all"
            >
              {loading ? 'Generating...' : 'Generate dashboards →'}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}