export default function PreviewScreen({ dashboards, onSelect }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-5xl">

        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold mb-1">
            Choose your <span className="text-indigo-400">dashboard</span>
          </h2>
          <p className="text-white/40 text-sm">
            {dashboards.length} layouts generated — pick the one that fits best
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {dashboards.map((dashboard, i) => (
            <button
              key={i}
              onClick={() => onSelect(dashboard)}
              className="group bg-white/5 hover:bg-white/8 border border-white/10 hover:border-indigo-500/50 rounded-2xl p-5 text-left transition-all backdrop-blur-sm"
            >
              {/* Coverage badge */}
              <div className="flex items-center justify-between mb-4">
                <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${
                  dashboard.kpi_coverage >= 90
                    ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                    : dashboard.kpi_coverage >= 70
                    ? 'bg-amber-500/20 border-amber-500/30 text-amber-300'
                    : 'bg-red-500/20 border-red-500/30 text-red-300'
                }`}>
                  {dashboard.kpi_coverage}% coverage
                </span>
                <span className="text-white/20 text-xs">#{i + 1}</span>
              </div>

              {/* Title and description */}
              <h3 className="text-white font-semibold text-base mb-1">{dashboard.title}</h3>
              <p className="text-white/40 text-xs mb-5 leading-relaxed">{dashboard.description}</p>

              {/* Chart previews */}
              <div className="space-y-2">
                {dashboard.charts?.slice(0, 3).map((chart, j) => (
                  <div key={j} className="bg-white/5 rounded-lg px-3 py-2 flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      chart.chart_type === 'bar' ? 'bg-indigo-400' :
                      chart.chart_type === 'line' ? 'bg-emerald-400' : 'bg-amber-400'
                    }`} />
                    <span className="text-white/60 text-xs truncate">{chart.title}</span>
                    <span className="text-white/25 text-xs ml-auto flex-shrink-0">{chart.chart_type}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 text-indigo-400 text-xs font-medium group-hover:text-indigo-300 transition-colors">
                Select this dashboard →
              </div>
            </button>
          ))}
        </div>

      </div>
    </div>
  )
}