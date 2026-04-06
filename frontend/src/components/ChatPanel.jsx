import { useState } from 'react'
import { sendChat } from '../api'

export default function ChatPanel({ dashboardContext, onClose }) {
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
      position: 'fixed', bottom: '88px', right: '24px',
      width: '340px', maxHeight: '500px',
      background: '#0f1729',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '16px',
      display: 'flex', flexDirection: 'column',
      zIndex: 99,
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: 'DM Sans', fontSize: '13px', fontWeight: 500, color: 'white' }}>Ask about this data</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: '18px', lineHeight: 1 }}>×</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
        {messages.length === 0 && (
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)', textAlign: 'center', padding: '20px 0', fontFamily: 'DM Sans' }}>
            Ask anything about the dashboard...
          </p>
        )}
        {messages.map((msg, i) => (
          <div key={i} style={{ marginBottom: '10px' }}>
            <div style={{
              padding: '8px 12px', borderRadius: '10px', fontSize: '12px', lineHeight: 1.5,
              background: msg.role === 'user' ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.05)',
              color: msg.role === 'user' ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.75)',
              marginLeft: msg.role === 'user' ? '20px' : '0',
              fontFamily: 'DM Sans',
            }}>
              {msg.content}
            </div>
            {msg.scores && (
              <div style={{ display: 'flex', gap: '4px', marginTop: '4px', flexWrap: 'wrap' }}>
                {Object.entries(msg.scores).map(([k, v]) => (
                  <span key={k} style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '20px', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', color: '#34d399', fontFamily: 'DM Mono' }}>
                    {k} {v}/5
                  </span>
                ))}
              </div>
            )}
            {msg.suggestions && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                {msg.suggestions.map((s, j) => (
                  <button key={j} onClick={() => setInput(s)} style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '6px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#a5b4fc', cursor: 'pointer', fontFamily: 'DM Sans' }}>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div style={{ padding: '8px 12px', borderRadius: '10px', fontSize: '12px', color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.05)', fontFamily: 'DM Sans' }}>
            Thinking...
          </div>
        )}
      </div>

      <div style={{ padding: '10px 12px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: '8px' }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Ask a question..."
          style={{
            flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '8px', padding: '7px 10px', fontSize: '12px', color: 'white',
            outline: 'none', fontFamily: 'DM Sans',
          }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || loading}
          style={{
            width: '32px', height: '32px', borderRadius: '8px', border: 'none',
            background: '#6366f1', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: (!input.trim() || loading) ? 0.4 : 1,
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M1 6h10M6 1l5 5-5 5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  )
}