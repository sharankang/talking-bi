import { useState } from 'react'
import { sendChat } from '../api'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const RAINBOW = ['#00d2ff','#3fb950','#ffa600','#f85149','#7b2ff7','#ff6b9d','#00e5a0','#ffcc00']

function MultiColorBar(props) {
  const { x, y, width, height, index } = props
  return <rect x={x} y={y} width={width} height={height} fill={RAINBOW[index % RAINBOW.length]} rx={2}/>
}

function MiniChart({ data, chartType }) {
  if (!data || data.length === 0) return null
  const tip = { contentStyle: { background: '#0d1117', border: '1px solid #30363d', borderRadius: '8px', fontFamily: 'Space Grotesk', fontSize: '11px' }, labelStyle: { color: '#e6edf3' }, itemStyle: { color: '#8b949e' } }

  if (chartType === 'line') return (
    <ResponsiveContainer width="100%" height={150}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="label" tick={{ fill: '#6e7681', fontSize: 9, fontFamily: 'Space Mono' }} />
        <YAxis tick={{ fill: '#6e7681', fontSize: 9, fontFamily: 'Space Mono' }} width={35}/>
        <Tooltip {...tip} />
        <Line type="monotone" dataKey="value" stroke="#00d2ff" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )

  if (chartType === 'pie') return (
    <ResponsiveContainer width="100%" height={150}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={55} paddingAngle={2}>
          {data.map((_, i) => <Cell key={i} fill={RAINBOW[i % RAINBOW.length]} />)}
        </Pie>
        <Tooltip {...tip} />
      </PieChart>
    </ResponsiveContainer>
  )

  return (
    <ResponsiveContainer width="100%" height={150}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="label" tick={{ fill: '#6e7681', fontSize: 9, fontFamily: 'Space Mono' }} />
        <YAxis tick={{ fill: '#6e7681', fontSize: 9, fontFamily: 'Space Mono' }} width={35}/>
        <Tooltip {...tip} />
        <Bar dataKey="value" shape={<MultiColorBar />} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export default function ChatPanel({ dashboardContext, inline, dbUrl }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSend = async () => {
    if (!input.trim() || loading) return
    const userMsg = { role: 'user', content: input }
    setMessages(prev => [...prev, userMsg])
    setInput(''); setLoading(true)
    try {
      const res = await sendChat(input, dashboardContext, messages, dbUrl)
      const r = res.data.response
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: r.answer,
        scores: r.insight_scores,
        suggestions: r.follow_up_suggestions,
        chartData: res.data.chart_data,
        chartType: r.chart_type,
        chartTitle: r.chart_title,
        sqlQuery: r.sql_query,
      }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong. Try again.' }])
    } finally { setLoading(false) }
  }

  const starters = ['What was the peak month?', 'Which category leads in sales?', 'Show me the top 5 by revenue']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'transparent' }}>
      <style>{`
        .chat-input-field { background:rgba(255,255,255,0.04);border:1px solid #30363d;border-radius:8px;padding:8px 12px;font-size:12px;color:#e6edf3;outline:none;font-family:'Space Grotesk',sans-serif;width:100%; }
        .chat-input-field:focus { border-color:#00d2ff; }
        .chat-input-field::placeholder { color:#6e7681; }
      `}</style>

      <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid #21262d' }}>
        <p style={{ fontFamily: 'Space Grotesk', fontSize: '13px', fontWeight: 600, color: '#e6edf3', margin: 0 }}>Ask about this data</p>
        <p style={{ fontFamily: 'Space Mono', fontSize: '9px', color: '#6e7681', margin: '3px 0 0', letterSpacing: '0.06em' }}>GEMINI · INSIGHT EVAL · CHARTS</p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
        {messages.length === 0 && (
          <div style={{ padding: '16px 0' }}>
            <p style={{ fontFamily: 'Space Grotesk', fontSize: '12px', color: '#6e7681', textAlign: 'center', marginBottom: '14px' }}>
              Every answer comes with a chart
            </p>
            {starters.map((s, i) => (
              <button key={i} onClick={() => setInput(s)} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', marginBottom: '6px', background: 'rgba(255,255,255,0.03)', border: '1px solid #21262d', borderRadius: '8px', color: '#8b949e', fontSize: '11px', cursor: 'pointer', fontFamily: 'Space Grotesk', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#00d2ff'; e.currentTarget.style.color = '#00d2ff' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#21262d'; e.currentTarget.style.color = '#8b949e' }}>
                {s}
              </button>
            ))}
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} style={{ marginBottom: '14px' }}>
            <div style={{
              padding: '9px 12px', borderRadius: '10px', fontSize: '12px', lineHeight: 1.55,
              background: msg.role === 'user' ? 'rgba(0,210,255,0.1)' : 'rgba(255,255,255,0.04)',
              color: msg.role === 'user' ? '#e6edf3' : '#c9d1d9',
              marginLeft: msg.role === 'user' ? '20px' : '0',
              fontFamily: 'Space Grotesk',
              border: `1px solid ${msg.role === 'user' ? 'rgba(0,210,255,0.2)' : '#21262d'}`,
            }}>
              {msg.content}
            </div>

            {msg.role === 'assistant' && msg.chartData && msg.chartData.length > 0 && (
              <div style={{ marginTop: '8px', background: '#0d1117', border: '1px solid #21262d', borderRadius: '10px', padding: '12px' }}>
                {msg.chartTitle && <p style={{ fontFamily: 'Space Grotesk', fontSize: '11px', fontWeight: 600, color: '#8b949e', marginBottom: '8px' }}>{msg.chartTitle}</p>}
                <MiniChart data={msg.chartData} chartType={msg.chartType || 'bar'} />
              </div>
            )}

            {msg.role === 'assistant' && msg.sqlQuery && msg.sqlQuery !== 'null' && (
              <details style={{ marginTop: '6px' }}>
                <summary style={{ fontFamily: 'Space Mono', fontSize: '9px', color: '#6e7681', cursor: 'pointer', letterSpacing: '0.06em', textTransform: 'uppercase', listStyle: 'none' }}>
                  ▸ SQL used
                </summary>
                <pre style={{ marginTop: '6px', background: '#0d1117', border: '1px solid #21262d', borderRadius: '8px', padding: '8px 10px', fontSize: '10px', fontFamily: 'Space Mono', color: '#3fb950', overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {msg.sqlQuery}
                </pre>
              </details>
            )}

            {msg.scores && (
              <div style={{ display: 'flex', gap: '4px', marginTop: '5px', flexWrap: 'wrap' }}>
                {Object.entries(msg.scores).map(([k, v]) => (
                  <span key={k} style={{ fontSize: '9px', padding: '2px 7px', borderRadius: '20px', background: 'rgba(63,185,80,0.1)', border: '1px solid rgba(63,185,80,0.2)', color: '#3fb950', fontFamily: 'Space Mono' }}>
                    {k} {v}/5
                  </span>
                ))}
              </div>
            )}

            {msg.suggestions?.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '7px' }}>
                {msg.suggestions.map((s, j) => (
                  <button key={j} onClick={() => setInput(s)} style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '6px', background: 'rgba(0,210,255,0.06)', border: '1px solid rgba(0,210,255,0.15)', color: '#00d2ff', cursor: 'pointer', fontFamily: 'Space Grotesk' }}>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div style={{ padding: '9px 12px', borderRadius: '10px', fontSize: '12px', color: '#6e7681', background: 'rgba(255,255,255,0.03)', fontFamily: 'Space Grotesk', border: '1px solid #21262d' }}>
            Thinking...
          </div>
        )}
      </div>

      <div style={{ padding: '12px', borderTop: '1px solid #21262d', display: 'flex', gap: '8px', alignItems: 'center' }}>
        <input className="chat-input-field" type="text" value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Ask about your data..."
        />
        <button onClick={handleSend} disabled={!input.trim() || loading} style={{ width: '34px', height: '34px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg,#00d2ff,#7b2ff7)', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: (!input.trim() || loading) ? 0.35 : 1 }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M1 6h10M6 1l5 5-5 5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  )
}