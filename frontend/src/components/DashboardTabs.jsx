import { useState } from 'react'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899']

function Chart({ chart }) {
  const data = chart.data || []
  const color = chart.color || '#6366f1'

  const tooltipStyle = {
    contentStyle: { background: '#0f1729', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontFamily: 'DM Sans', fontSize: '12px' },
    labelStyle: { color: 'white' },
    itemStyle: { color: 'rgba(255,255,255,0.7)' }
  }

  if (chart.chart_type === 'line') {
    return (
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis dataKey="label" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: 'DM Mono' }} />
          <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: 'DM Mono' }} />
          <Tooltip {...tooltipStyle} />
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    )
  }

  if (chart.chart_type === 'pie') {
    return (
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={80}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip {...tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'DM Mono', color: 'rgba(255,255,255,0.4)' }} />
        </PieChart>
      </ResponsiveContainer>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis dataKey="label" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: 'DM Mono' }} />
        <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: 'DM Mono' }} />
        <Tooltip {...tooltipStyle} />
        <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export default function DashboardTabs({ tabs }) {
  const [active, setActive] = useState(0)
  if (!tabs || tabs.length === 0) return null

  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0' }}>
        {tabs.map((tab, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            style={{
              padding: '8px 16px',
              background: 'none',
              border: 'none',
              borderBottom: active === i ? '2px solid #fbbf24' : '2px solid transparent',
              color: active === i ? '#fbbf24' : 'rgba(255,255,255,0.4)',
              fontFamily: 'DM Sans',
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'color 0.15s',
              marginBottom: '-1px',
            }}
          >
            {tab.name}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '16px' }}>
        {tabs[active]?.charts?.map((chart, i) => (
          <div key={i} style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '12px',
            padding: '16px',
          }}>
            <h4 style={{ fontFamily: 'DM Sans', fontWeight: 500, fontSize: '13px', color: 'white', marginBottom: '4px' }}>
              {chart.title}
            </h4>
            {chart.insight && (
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginBottom: '12px', fontFamily: 'DM Sans' }}>
                {chart.insight}
              </p>
            )}
            <Chart chart={chart} />
          </div>
        ))}
      </div>
    </div>
  )
}