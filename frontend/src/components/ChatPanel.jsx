import { useState } from 'react'
import { sendChat } from '../api'

export default function ChatPanel({ dashboardContext, onClose, inline }) {
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
      const res = await sendChat(input, dashboardContext, messages)
      const r = res.data.response
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: r.answer,
        scores: r.insight_scores,
        suggestions: r.follow_up_suggestions,
      }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong. Try again.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: inline ? '100vh' : 'auto',
      background: inline ? 'transparent' : '#0f1729',
      border: inline ? 'none' : '1px solid rgba(255,255,255,0.1)',
      borderRadius: inline ? 0 : '16px',
    }}>
      <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ fontFamily: 'DM Sans', fontSize: '13px', fontWeight: 500, color: 'white', margin: 0 }}>Ask about this data</p>
          <p style={{ fontFamily: 'DM Mono', fontSize: '10px', color: 'rgba(255,255,255,0.25)', margin: '2px 0 0', letterSpacing: '0.06em' }}>GEMINI · INSIGHT EVAL</p>
        </div>
        {!inline && onClose && (
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: '18px', lineHeight: 1 }}>×</button>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px' }}>
        {messages.length === 0 && (
          <div style={{ padding: '24px 0', textAlign: 'center' }}>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.18)', fontFamily: 'DM Sans', marginBottom: '16px' }}>
              Ask anything about your dashboard
            </p>
            {[
              'What was the peak revenue month?',
              'Which category has the best margins?',
              'How many delivered orders are there?',
            ].map((s, i) => (
              <button key={i} onClick={() => setInput(s)} style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '8px 12px', marginBottom: '6px',
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '8px', color: 'rgba(255,255,255,0.4)', fontSize: '11px',
                cursor: 'pointer', fontFamily: 'DM Sans',
              }}>
                {s}
              </button>
            ))}
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} style={{ marginBottom: '12px' }}>
            <div style={{
              padding: '9px 12px', borderRadius: '10px', fontSize: '12px', lineHeight: 1.55,
              background: msg.role === 'user' ? 'rgba(251,191,36,0.12)' : 'rgba(255,255,255,0.04)',
              color: msg.role === 'user' ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.7)',
              marginLeft: msg.role === 'user' ? '24px' : '0',
              fontFamily: 'DM Sans',
              border: msg.role === 'user' ? '1px solid rgba(251,191,36,0.2)' : '1px solid rgba(255,255,255,0.05)',
            }}>
              {msg.content}
            </div>
            {msg.scores && (
              <div style={{ display: 'flex', gap: '4px', marginTop: '5px', flexWrap: 'wrap' }}>
                {Object.entries(msg.scores).map(([k, v]) => (
                  <span key={k} style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '20px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#34d399', fontFamily: 'DM Mono' }}>
                    {k} {v}/5
                  </span>
                ))}
              </div>
            )}
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
          <div style={{ padding: '9px 12px', borderRadius: '10px', fontSize: '12px', color: 'rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.03)', fontFamily: 'DM Sans', border: '1px solid rgba(255,255,255,0.05)' }}>
            Thinking...
          </div>
        )}
      </div>

      <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: '8px' }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Ask a question..."
          style={{
            flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '8px', padding: '7px 10px', fontSize: '12px', color: 'white',
            outline: 'none', fontFamily: 'DM Sans',
          }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || loading}
          style={{
            width: '32px', height: '32px', borderRadius: '8px', border: 'none',
            background: '#fbbf24', cursor: 'pointer', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: (!input.trim() || loading) ? 0.35 : 1,
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M1 6h10M6 1l5 5-5 5" stroke="#0a0a0a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  )
}