import { useState } from 'react'
import { sendChat } from '../api'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

function MiniChart({ data, chartType, color }) {
  if (!data || data.length === 0) return null

  const tooltipStyle = {
    contentStyle: { background: '#0a0f1e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontFamily: 'DM Sans', fontSize: '11px' },
    labelStyle: { color: 'white' },
    itemStyle: { color: 'rgba(255,255,255,0.7)' }
  }

  if (chartType === 'line') {
    return (
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis dataKey="label" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9, fontFamily: 'DM Mono' }} />
          <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9, fontFamily: 'DM Mono' }} width={40} />
          <Tooltip {...tooltipStyle} />
          <Line type="monotone" dataKey="value" stroke={color || '#fbbf24'} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    )
  }

  if (chartType === 'pie') {
    return (
      <ResponsiveContainer width="100%" height={160}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={60}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip {...tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 10, fontFamily: 'DM Mono', color: 'rgba(255,255,255,0.4)' }} />
        </PieChart>
      </ResponsiveContainer>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis dataKey="label" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9, fontFamily: 'DM Mono' }} />
        <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9, fontFamily: 'DM Mono' }} width={40} />
        <Tooltip {...tooltipStyle} />
        <Bar dataKey="value" fill={color || '#fbbf24'} radius={[3, 3, 0, 0]} />
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
    setInput('')
    setLoading(true)
    try {
      const res = await sendChat(input, dashboardContext, messages, dbUrl)
      const r = res.data.response
      const chartData = res.data.chart_data
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: r.answer,
        scores: r.insight_scores,
        suggestions: r.follow_up_suggestions,
        chartData: chartData,
        chartType: r.chart_type,
        chartTitle: r.chart_title,
        sqlQuery: r.sql_query,
      }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong. Try again.' }])
    } finally {
      setLoading(false)
    }
  }

  const border = 'rgba(255,255,255,0.07)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: inline ? '100vh' : 'auto', background: 'transparent', border: inline ? 'none' : `1px solid ${border}`, borderRadius: inline ? 0 : '16px' }}>

      {/* Header */}
      <div style={{ padding: '16px 16px 12px', borderBottom: `1px solid ${border}` }}>
        <p style={{ fontFamily: 'DM Sans', fontSize: '13px', fontWeight: 500, color: 'white', margin: 0 }}>Ask about this data</p>
        <p style={{ fontFamily: 'DM Mono', fontSize: '10px', color: 'rgba(255,255,255,0.25)', margin: '2px 0 0', letterSpacing: '0.06em' }}>GEMINI · INSIGHT EVAL</p>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px' }}>
        {messages.length === 0 && (
          <div style={{ padding: '20px 0', textAlign: 'center' }}>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.18)', fontFamily: 'DM Sans', marginBottom: '14px' }}>
              Ask anything — answers come with charts
            </p>
            {[
              'What was the peak revenue month?',
              'Which category has the highest sales?',
              'Show me customer distribution by region',
            ].map((s, i) => (
              <button key={i} onClick={() => setInput(s)} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', marginBottom: '6px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', color: 'rgba(255,255,255,0.4)', fontSize: '11px', cursor: 'pointer', fontFamily: 'DM Sans' }}>
                {s}
              </button>
            ))}
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} style={{ marginBottom: '14px' }}>

            {/* Message bubble */}
            <div style={{
              padding: '9px 12px', borderRadius: '10px', fontSize: '12px', lineHeight: 1.55,
              background: msg.role === 'user' ? 'rgba(251,191,36,0.1)' : 'rgba(255,255,255,0.04)',
              color: msg.role === 'user' ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.75)',
              marginLeft: msg.role === 'user' ? '24px' : '0',
              fontFamily: 'DM Sans',
              border: `1px solid ${msg.role === 'user' ? 'rgba(251,191,36,0.2)' : border}`,
            }}>
              {msg.content}
            </div>

            {/* Chart (only for assistant messages with data) */}
            {msg.role === 'assistant' && msg.chartData && msg.chartData.length > 0 && (
              <div style={{ marginTop: '8px', background: 'rgba(255,255,255,0.02)', border: `1px solid ${border}`, borderRadius: '10px', padding: '12px' }}>
                {msg.chartTitle && (
                  <p style={{ fontFamily: 'DM Sans', fontSize: '11px', fontWeight: 500, color: 'rgba(255,255,255,0.7)', marginBottom: '8px' }}>
                    {msg.chartTitle}
                  </p>
                )}
                <MiniChart
                  data={msg.chartData}
                  chartType={msg.chartType || 'bar'}
                  color="#fbbf24"
                />
              </div>
            )}

            {/* SQL used */}
            {msg.role === 'assistant' && msg.sqlQuery && msg.sqlQuery !== 'null' && (
              <details style={{ marginTop: '6px' }}>
                <summary style={{ fontFamily: 'DM Mono', fontSize: '10px', color: 'rgba(255,255,255,0.2)', cursor: 'pointer', letterSpacing: '0.06em', textTransform: 'uppercase', listStyle: 'none' }}>
                  ▸ SQL used
                </summary>
                <pre style={{ marginTop: '6px', background: 'rgba(0,0,0,0.3)', border: `1px solid ${border}`, borderRadius: '8px', padding: '8px 10px', fontSize: '10px', fontFamily: 'DM Mono', color: 'rgba(255,255,255,0.45)', overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {msg.sqlQuery}
                </pre>
              </details>
            )}

            {/* Insight scores */}
            {msg.scores && (
              <div style={{ display: 'flex', gap: '4px', marginTop: '5px', flexWrap: 'wrap' }}>
                {Object.entries(msg.scores).map(([k, v]) => (
                  <span key={k} style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '20px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#34d399', fontFamily: 'DM Mono' }}>
                    {k} {v}/5
                  </span>
                ))}
              </div>
            )}

            {/* Follow-up suggestions */}
            {msg.suggestions && msg.suggestions.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '7px' }}>
                {msg.suggestions.map((s, j) => (
                  <button key={j} onClick={() => setInput(s)} style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '6px', background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.18)', color: '#fbbf24', cursor: 'pointer', fontFamily: 'DM Sans' }}>
                    {s}
                  </button>
                ))}
              </div>
            )}

          </div>
        ))}

        {loading && (
          <div style={{ padding: '9px 12px', borderRadius: '10px', fontSize: '12px', color: 'rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.03)', fontFamily: 'DM Sans', border: `1px solid ${border}` }}>
            Thinking...
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ padding: '12px', borderTop: `1px solid ${border}`, display: 'flex', gap: '8px' }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Ask a question..."
          style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: `1px solid ${border}`, borderRadius: '8px', padding: '7px 10px', fontSize: '12px', color: 'white', outline: 'none', fontFamily: 'DM Sans' }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || loading}
          style={{ width: '32px', height: '32px', borderRadius: '8px', border: 'none', background: '#fbbf24', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: (!input.trim() || loading) ? 0.35 : 1 }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M1 6h10M6 1l5 5-5 5" stroke="#0a0a0a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  )
}