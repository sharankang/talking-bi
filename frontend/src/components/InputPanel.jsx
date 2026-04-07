import { useState, useRef } from 'react'
import { analyseQuery } from '../api'

export default function InputPanel({ onResult, loading, setLoading, exploration, dbSource, dbUrl }) {
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef(null)

  const handleVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { alert('Use Chrome for voice input'); return }
    if (listening) { recognitionRef.current?.stop(); setListening(false); return }
    const r = new SR()
    r.lang = 'en-US'
    r.onresult = e => { setInput(e.results[0][0].transcript); setListening(false) }
    r.onerror = () => setListening(false)
    r.onend = () => setListening(false)
    recognitionRef.current = r
    r.start()
    setListening(true)
  }

  const handleSubmit = async () => {
    if (!input.trim() || loading) return
    setLoading(true)
    setError('')
    try {
      const res = await analyseQuery(input, dbUrl)
      onResult(res.data, input)
    } catch (e) {
      setError('Analysis failed. Check the backend is running.')
      setLoading(false)
    }
  }

  const suggestedKpis = exploration?.suggested_kpis?.slice(0, 5) || []

  const isCsv = dbSource?.startsWith('csv:')
  const sourceLabel = isCsv ? dbSource.replace('csv:', '') : 'PostgreSQL'

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <style>{`
        .dot-grid{position:absolute;inset:0;background-image:radial-gradient(circle,rgba(255,255,255,0.04) 1px,transparent 1px);background-size:28px 28px;pointer-events:none;}
        .amb1{position:absolute;top:-180px;left:30%;width:480px;height:380px;background:radial-gradient(ellipse,rgba(251,191,36,0.07) 0%,transparent 70%);pointer-events:none;}
        .ip-textarea{width:100%;background:transparent;border:none;outline:none;color:rgba(255,255,255,0.9);font-family:'DM Mono',monospace;font-size:13px;line-height:1.75;resize:none;caret-color:#fbbf24;}
        .ip-textarea::placeholder{color:rgba(255,255,255,0.15);}
        .analyse-btn{width:100%;padding:13px;background:#fbbf24;border:none;border-radius:10px;color:#0a0a0a;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:500;cursor:pointer;transition:background 0.2s;margin-top:10px;}
        .analyse-btn:hover:not(:disabled){background:#f59e0b;}
        .analyse-btn:disabled{opacity:0.35;cursor:not-allowed;}
        .chip{padding:5px 12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:6px;color:rgba(255,255,255,0.38);font-family:'DM Mono',monospace;font-size:11px;cursor:pointer;transition:all 0.15s;white-space:nowrap;}
        .chip:hover{background:rgba(251,191,36,0.1);border-color:rgba(251,191,36,0.3);color:rgba(255,255,255,0.7);}
        .sdot{width:6px;height:6px;border-radius:50%;background:#10b981;box-shadow:0 0 7px rgba(16,185,129,0.5);animation:blink 2s ease infinite;display:inline-block;}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0.3}}
      `}</style>

      <div className="dot-grid"/>
      <div className="amb1"/>

      <div style={{ width: '100%', maxWidth: '560px', position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '16px' }}>
            <span className="sdot"/>
            <span style={{ fontFamily: 'DM Mono', fontSize: '10px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.12em' }}>
              {sourceLabel.toUpperCase()} · CONNECTED
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '14px', flexWrap: 'wrap' }}>
            <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 'clamp(2.4rem, 6vw, 3.4rem)', lineHeight: 1, letterSpacing: '-0.03em', color: 'white', margin: 0 }}>
              Talking <span style={{ color: '#fbbf24' }}>BI</span>
            </h1>
            <p style={{ fontFamily: 'DM Sans', fontSize: '14px', color: 'rgba(255,255,255,0.28)', fontWeight: 300, fontStyle: 'italic', margin: 0 }}>
              {exploration?.business_description?.split('.')[0] || 'natural language → dashboards'}
            </p>
          </div>
        </div>

        {/* Input box */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '14px 16px', marginBottom: '0' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            <span style={{ fontFamily: 'DM Mono', fontSize: '13px', color: '#fbbf24', paddingTop: '2px', flexShrink: 0, opacity: 0.7 }}>›_</span>
            <textarea
              className="ip-textarea"
              rows={3}
              placeholder="Ask anything about your data..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit() } }}
            />
            <button
              onClick={handleVoice}
              style={{ width: '36px', height: '36px', borderRadius: '8px', border: 'none', background: listening ? 'rgba(239,68,68,0.18)' : 'rgba(255,255,255,0.04)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            >
              <svg width="12" height="16" viewBox="0 0 12 16" fill="none">
                <rect x="3" y="0" width="6" height="10" rx="3" fill={listening ? '#ef4444' : 'rgba(255,255,255,0.45)'}/>
                <path d="M1 7.5a5 5 0 0 0 10 0" stroke={listening ? '#ef4444' : 'rgba(255,255,255,0.45)'} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                <line x1="6" y1="12.5" x2="6" y2="15" stroke={listening ? '#ef4444' : 'rgba(255,255,255,0.45)'} strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
          {error && <p style={{ fontFamily: 'DM Mono', fontSize: '11px', color: '#f87171', marginTop: '8px', paddingLeft: '22px' }}>{error}</p>}
        </div>

        <button className="analyse-btn" onClick={handleSubmit} disabled={loading || !input.trim()}>
          {loading ? 'Generating dashboards...' : 'Analyse →'}
        </button>

        {/* Suggested KPIs from schema */}
        {suggestedKpis.length > 0 && (
          <div style={{ marginTop: '18px' }}>
            <p style={{ fontFamily: 'DM Mono', fontSize: '10px', color: 'rgba(255,255,255,0.16)', letterSpacing: '0.12em', marginBottom: '9px', textTransform: 'uppercase' }}>
              Suggested for your data
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
              {suggestedKpis.map((kpi, i) => (
                <button key={i} className="chip" onClick={() => setInput(kpi.description || kpi.name)}>
                  {kpi.name}
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}