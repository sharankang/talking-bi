import { useState } from 'react'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

const RAINBOW = ['#00d2ff','#3fb950','#ffa600','#f85149','#7b2ff7','#ff6b9d','#00e5a0','#ffcc00','#4d9fff','#ff8c42']

function MultiColorBar(props) {
  const { x, y, width, height, index } = props
  return <rect x={x} y={y} width={width} height={height} fill={RAINBOW[index % RAINBOW.length]} rx={3}/>
}

function Chart({ chart }) {
  const data = chart.data || []

  const tooltipStyle = {
    contentStyle: { background: '#161b22', border: '1px solid #30363d', borderRadius: '8px', fontFamily: 'Space Grotesk', fontSize: '12px' },
    labelStyle: { color: '#e6edf3' },
    itemStyle: { color: '#8b949e' }
  }

  if (chart.chart_type === 'line') {
    return (
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="label" tick={{ fill: '#6e7681', fontSize: 10, fontFamily: 'Space Mono' }} />
          <YAxis tick={{ fill: '#6e7681', fontSize: 10, fontFamily: 'Space Mono' }} />
          <Tooltip {...tooltipStyle} />
          <Line type="monotone" dataKey="value" stroke="#00d2ff" strokeWidth={2.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    )
  }

  if (chart.chart_type === 'pie') {
    return (
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={85} paddingAngle={2}>
            {data.map((_, i) => <Cell key={i} fill={RAINBOW[i % RAINBOW.length]} />)}
          </Pie>
          <Tooltip {...tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 10, fontFamily: 'Space Mono', color: '#6e7681' }} />
        </PieChart>
      </ResponsiveContainer>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="label" tick={{ fill: '#6e7681', fontSize: 10, fontFamily: 'Space Mono' }} />
        <YAxis tick={{ fill: '#6e7681', fontSize: 10, fontFamily: 'Space Mono' }} />
        <Tooltip {...tooltipStyle} />
        <Bar dataKey="value" shape={<MultiColorBar />} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export default function DashboardTabs({ tabs }) {
  const [active, setActive] = useState(0)
  if (!tabs || tabs.length === 0) return null

  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', gap: '2px', marginBottom: '16px', borderBottom: '1px solid #21262d', overflowX: 'auto' }}>
        {tabs.map((tab, i) => (
          <button key={i} onClick={() => setActive(i)} style={{
            padding: '8px 16px', background: 'none', border: 'none',
            borderBottom: active === i ? '2px solid #00d2ff' : '2px solid transparent',
            color: active === i ? '#00d2ff' : '#6e7681',
            fontFamily: 'Space Grotesk', fontSize: '13px', fontWeight: active === i ? 500 : 400,
            cursor: 'pointer', transition: 'all 0.15s', marginBottom: '-1px', whiteSpace: 'nowrap',
          }}>
            {tab.name}
          </button>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '14px' }}>
        {tabs[active]?.charts?.map((chart, i) => (
          <div key={i} style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: '12px', padding: '16px' }}>
            <h4 style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: '13px', color: '#e6edf3', marginBottom: '4px' }}>
              {chart.title}
            </h4>
            {chart.insight && (
              <p style={{ fontSize: '11px', color: '#6e7681', marginBottom: '12px', fontFamily: 'Space Grotesk' }}>
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