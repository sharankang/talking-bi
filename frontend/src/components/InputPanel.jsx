import { useState, useRef } from 'react'
import { analyseQuery } from '../api'

export default function InputPanel({ onResult, loading, setLoading, exploration, dbSource, dbUrl, databaseLabel }) {
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
    recognitionRef.current = r; r.start(); setListening(true)
  }

  const handleSubmit = async () => {
    if (!input.trim() || loading) return
    setLoading(true); setError('')
    try {
      const res = await analyseQuery(input, dbUrl)
      onResult(res.data, input)
    } catch {
      setError('Analysis failed. Check the backend is running.')
      setLoading(false)
    }
  }

  const suggestedKpis = exploration?.suggested_kpis?.slice(0, 5) || []

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', position: 'relative', overflow: 'hidden' }}>
      <style>{`
        .grid-bg{position:absolute;inset:0;background-image:linear-gradient(rgba(0,210,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(0,210,255,0.02) 1px,transparent 1px);background-size:40px 40px;pointer-events:none;}
        .glow-top{position:absolute;top:-200px;left:50%;transform:translateX(-50%);width:600px;height:400px;background:radial-gradient(ellipse,rgba(0,210,255,0.07) 0%,transparent 70%);pointer-events:none;}
        .ip-textarea{width:100%;background:transparent;border:none;outline:none;color:#e6edf3;font-family:'Space Mono',monospace;font-size:13px;line-height:1.7;resize:none;caret-color:#00d2ff;}
        .ip-textarea::placeholder{color:#6e7681;}
        .analyse-btn{width:100%;padding:13px;background:linear-gradient(135deg,#00d2ff,#7b2ff7);border:none;border-radius:8px;color:white;font-family:'Space Grotesk',sans-serif;font-size:14px;font-weight:600;cursor:pointer;transition:opacity 0.2s;margin-top:10px;}
        .analyse-btn:hover:not(:disabled){opacity:0.9;}
        .analyse-btn:disabled{opacity:0.35;cursor:not-allowed;}
        .kpi-chip{padding:5px 12px;background:rgba(255,255,255,0.04);border:1px solid #30363d;border-radius:6px;color:#8b949e;font-family:'Space Mono',monospace;font-size:10px;cursor:pointer;transition:all 0.15s;white-space:nowrap;}
        .kpi-chip:hover{background:rgba(0,210,255,0.08);border-color:rgba(0,210,255,0.3);color:#00d2ff;}
        .sdot{width:7px;height:7px;border-radius:50%;background:#3fb950;box-shadow:0 0 8px rgba(63,185,80,0.5);display:inline-block;animation:blink 2s ease infinite;}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0.3}}
      `}</style>

      <div className="grid-bg"/>
      <div className="glow-top"/>

      <div style={{ width: '100%', maxWidth: '560px', position: 'relative', zIndex: 1 }}>

        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <span className="sdot"/>
            <span style={{ fontFamily: 'Space Mono', fontSize: '10px', color: '#6e7681', letterSpacing: '0.1em' }}>
              {(databaseLabel || 'DATABASE').toUpperCase()} · CONNECTED
            </span>
          </div>
          <h1 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 'clamp(2.2rem,5vw,3rem)', lineHeight: 1.05, letterSpacing: '-0.02em', color: '#e6edf3', margin: '0 0 10px' }}>
            What do you want<br/>to <span style={{ background: 'linear-gradient(135deg,#00d2ff,#7b2ff7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>analyse?</span>
          </h1>
          {exploration?.business_description && (
            <p style={{ fontFamily: 'Space Grotesk', fontSize: '13px', color: '#6e7681', lineHeight: 1.5 }}>
              {exploration.business_description.split('.')[0]}.
            </p>
          )}
        </div>

        <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: '12px', padding: '14px 16px', marginBottom: '0' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            <span style={{ fontFamily: 'Space Mono', fontSize: '14px', color: '#00d2ff', paddingTop: '2px', flexShrink: 0 }}>›_</span>
            <textarea className="ip-textarea" rows={3}
              placeholder="Ask anything about your data..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit() } }}
            />
            <button onClick={handleVoice} style={{ width: '36px', height: '36px', borderRadius: '8px', border: 'none', background: listening ? 'rgba(248,81,73,0.15)' : 'rgba(255,255,255,0.04)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="12" height="16" viewBox="0 0 12 16" fill="none">
                <rect x="3" y="0" width="6" height="10" rx="3" fill={listening ? '#f85149' : '#8b949e'}/>
                <path d="M1 7.5a5 5 0 0 0 10 0" stroke={listening ? '#f85149' : '#8b949e'} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                <line x1="6" y1="12.5" x2="6" y2="15" stroke={listening ? '#f85149' : '#8b949e'} strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
          {error && <p style={{ fontFamily: 'Space Mono', fontSize: '11px', color: '#f85149', marginTop: '8px', paddingLeft: '22px' }}>{error}</p>}
        </div>

        <button className="analyse-btn" onClick={handleSubmit} disabled={loading || !input.trim()}>
          {loading ? 'Generating dashboards...' : 'Analyse →'}
        </button>

        {suggestedKpis.length > 0 && (
          <div style={{ marginTop: '18px' }}>
            <p style={{ fontFamily: 'Space Mono', fontSize: '9px', color: '#6e7681', letterSpacing: '0.1em', marginBottom: '9px', textTransform: 'uppercase' }}>Suggested for your data</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
              {suggestedKpis.map((kpi, i) => (
                <button key={i} className="kpi-chip" onClick={() => setInput(kpi.description || kpi.name)}>{kpi.name}</button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}