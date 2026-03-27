import { useState } from 'react'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { sendChat } from '../api'

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

function ChartBlock({ chart }) {
  const data = chart.data || []

  if (chart.chart_type === 'line') {
    return (
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
          <XAxis dataKey="label" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
          <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
          <Tooltip
            contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
            labelStyle={{ color: 'white' }}
          />
          <Line type="monotone" dataKey="value" stroke={chart.color || '#6366f1'} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    )
  }

  if (chart.chart_type === 'pie') {
    return (
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={80}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
          />
          <Legend wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }} />
        </PieChart>
      </ResponsiveContainer>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
        <XAxis dataKey="label" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
        <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
        <Tooltip
          contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
          labelStyle={{ color: 'white' }}
        />
        <Bar dataKey="value" fill={chart.color || '#6366f1'} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export default function DashboardScreen({ dashboard, onBack }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [listening, setListening] = useState(false)

  const handleVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return
    if (listening) return
    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.onresult = (e) => {
      setInput(e.results[0][0].transcript)
      setListening(false)
    }
    recognition.onerror = () => setListening(false)
    recognition.onend = () => setListening(false)
    recognition.start()
    setListening(true)
  }

  const handleSend = async () => {
    if (!input.trim() || loading) return
    const userMsg = { role: 'user', content: input }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)
    try {
      const res = await sendChat(input, dashboard, messages)
      const aiResponse = res.data.response
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: aiResponse.answer,
        scores: aiResponse.insight_scores,
        suggestions: aiResponse.follow_up_suggestions
      }])
    } catch (e) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, something went wrong. Try again.'
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={onBack}
            className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-4 py-2 text-sm text-white/60 transition-all"
          >
            ← Back
          </button>
          <div>
            <h2 className="text-xl font-bold text-white">{dashboard.title}</h2>
            <p className="text-white/40 text-xs">{dashboard.description}</p>
          </div>
          <span className="ml-auto bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs px-3 py-1 rounded-full">
            {dashboard.kpi_coverage}% KPI coverage
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Charts grid */}
          <div className="lg:col-span-2 space-y-6">
            {dashboard.charts?.map((chart, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <h3 className="text-white font-medium text-sm mb-1">{chart.title}</h3>
                {chart.insight && (
                  <p className="text-white/40 text-xs mb-4">{chart.insight}</p>
                )}
                <ChartBlock chart={chart} />
              </div>
            ))}
          </div>

          {/* Chat panel */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col h-fit sticky top-8">
            <h3 className="text-white font-medium text-sm mb-4">Ask about this dashboard</h3>

            {/* Messages */}
            <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
              {messages.length === 0 && (
                <p className="text-white/25 text-xs text-center py-6">
                  Ask a question about the data...
                </p>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`${msg.role === 'user' ? 'ml-4' : 'mr-4'}`}>
                  <div className={`rounded-xl px-3 py-2.5 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-indigo-600/30 text-white/90 ml-auto'
                      : 'bg-white/7 text-white/75'
                  }`}>
                    {msg.content}
                  </div>
                  {msg.scores && (
                    <div className="flex gap-1.5 mt-1.5 flex-wrap">
                      {Object.entries(msg.scores).map(([k, v]) => (
                        <span key={k} className="text-xs bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 px-2 py-0.5 rounded-full">
                          {k} {v}/5
                        </span>
                      ))}
                    </div>
                  )}
                  {msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {msg.suggestions.map((s, j) => (
                        <button
                          key={j}
                          onClick={() => setInput(s)}
                          className="text-xs text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2 py-1 rounded-lg transition-colors"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="bg-white/7 rounded-xl px-3 py-2.5 text-xs text-white/40 mr-4">
                  Thinking...
                </div>
              )}
            </div>

            {/* Input */}
            <div className="flex gap-2 mt-auto">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Ask a question..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/25 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <button
                onClick={handleVoice}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                  listening ? 'bg-red-500' : 'bg-white/10 hover:bg-white/15'
                }`}
              >
                <svg width="12" height="16" viewBox="0 0 12 16" fill="none">
                  <rect x="3" y="0" width="6" height="10" rx="3" fill="white" opacity="0.7"/>
                  <path d="M1 7a5 5 0 0 0 10 0" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.7"/>
                  <line x1="6" y1="12" x2="6" y2="15" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/>
                </svg>
              </button>
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="w-9 h-9 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 rounded-xl flex items-center justify-center transition-all"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 7h12M7 1l6 6-6 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}