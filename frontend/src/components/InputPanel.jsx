import { useState, useRef, useEffect } from 'react'
import { analyseQuery, exploreData } from '../api'

const FALLBACK = [
  { label: 'Revenue by category', query: 'Show me total revenue by product category' },
  { label: 'Monthly order trends', query: 'Monthly order trends over time' },
  { label: 'Customer geography', query: 'Which states have the most customers?' },
  { label: 'Top products', query: 'Top 10 products by revenue' },
  { label: 'Order status breakdown', query: 'Show me the order status distribution' },
]

export default function InputPanel({ onResult, loading, setLoading }) {
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const [listening, setListening] = useState(false)
  const [exploration, setExploration] = useState(null)
  const [mounted, setMounted] = useState(false)
  const recognitionRef = useRef(null)

  useEffect(() => {
    setTimeout(() => setMounted(true), 100)
    exploreData().then(r => setExploration(r.data.exploration)).catch(() => {})
  }, [])

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
      const res = await analyseQuery(input)
      onResult(res.data, input)
    } catch (e) {
      setError('Backend unreachable — is the server running?')
      setLoading(false)
    }
  }

  const suggestions = exploration?.suggested_kpis?.slice(0, 5).map(k => ({
    label: k.name, query: k.description || k.name
  })) || FALLBACK

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
        .dot-grid { position:absolute;inset:0;background-image:radial-gradient(circle,rgba(255,255,255,0.05) 1px,transparent 1px);background-size:28px 28px;pointer-events:none; }
        .amb1 { position:absolute;top:-200px;left:50%;transform:translateX(-50%);width:500px;height:400px;background:radial-gradient(ellipse,rgba(99,102,241,0.1) 0%,transparent 70%);pointer-events:none; }
        .amb2 { position:absolute;bottom:-150px;right:-50px;width:400px;height:300px;background:radial-gradient(ellipse,rgba(16,185,129,0.06) 0%,transparent 70%);pointer-events:none; }
        .ip-fade { opacity:0;transform:translateY(20px);transition:opacity 0.6s ease,transform 0.6s ease; }
        .ip-fade.show { opacity:1;transform:translateY(0); }
        .ip-fade.d1 { transition-delay:0.1s; }
        .ip-fade.d2 { transition-delay:0.25s; }
        .ip-fade.d3 { transition-delay:0.4s; }
        .ip-textarea { width:100%;background:transparent;border:none;outline:none;color:rgba(255,255,255,0.9);font-family:'DM Mono',monospace;font-size:13px;line-height:1.7;resize:none;caret-color:#6366f1; }
        .ip-textarea::placeholder { color:rgba(255,255,255,0.15); }
        .ip-btn { width:100%;padding:13px;background:#6366f1;border:none;border-radius:10px;color:white;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:500;cursor:pointer;transition:background 0.2s,transform 0.1s;margin-top:12px; }
        .ip-btn:hover:not(:disabled) { background:#5254cc; }
        .ip-btn:disabled { opacity:0.4;cursor:not-allowed; }
        .ip-chip { padding:5px 12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:6px;color:rgba(255,255,255,0.4);font-family:'DM Mono',monospace;font-size:11px;cursor:pointer;transition:all 0.15s;white-space:nowrap; }
        .ip-chip:hover { background:rgba(99,102,241,0.12);border-color:rgba(99,102,241,0.35);color:rgba(255,255,255,0.75); }
        .status-dot { width:6px;height:6px;border-radius:50%;background:#10b981;box-shadow:0 0 8px rgba(16,185,129,0.5);animation:blink 2s ease infinite;display:inline-block; }
        @keyframes blink { 0%,100%{opacity:1}50%{opacity:0.3} }
      `}</style>

      <div className="dot-grid" />
      <div className="amb1" />
      <div className="amb2" />

      <div style={{ width: '100%', maxWidth: '580px', position: 'relative', zIndex: 1 }}>

        <div className={`ip-fade ${mounted ? 'show' : ''}`} style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', marginBottom: '18px' }}>
            <span className="status-dot" />
            <span style={{ fontFamily: 'DM Mono', fontSize: '10px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.12em' }}>
              OLIST · CONNECTED
            </span>
          </div>
          <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 'clamp(3rem,9vw,5rem)', lineHeight: 0.95, letterSpacing: '-0.02em', color: 'white', margin: 0 }}>
            Talking<br /><span style={{ color: '#6366f1' }}>BI</span>
          </h1>
          <p style={{ fontFamily: 'DM Sans', fontSize: '14px', color: 'rgba(255,255,255,0.3)', marginTop: '14px', fontWeight: 300 }}>
            Describe what you need in plain English.<br />Dashboards are generated automatically.
          </p>
        </div>

        <div className={`ip-fade d1 ${mounted ? 'show' : ''}`}>
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '14px',
            padding: '16px',
          }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <span style={{ fontFamily: 'DM Mono', fontSize: '14px', color: '#6366f1', paddingTop: '2px', flexShrink: 0 }}>›_</span>
              <textarea
                className="ip-textarea"
                rows={3}
                placeholder="e.g. show me revenue by category and monthly order trends..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit() } }}
              />
              <button
                onClick={handleVoice}
                style={{
                  width: '40px', height: '40px', borderRadius: '8px', border: 'none',
                  background: listening ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.05)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}
              >
                <svg width="13" height="17" viewBox="0 0 13 17" fill="none">
                  <rect x="3.5" y="0" width="6" height="10" rx="3" fill={listening ? '#ef4444' : 'rgba(255,255,255,0.5)'}/>
                  <path d="M1 8a5.5 5.5 0 0 0 11 0" stroke={listening ? '#ef4444' : 'rgba(255,255,255,0.5)'} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                  <line x1="6.5" y1="13.5" x2="6.5" y2="16" stroke={listening ? '#ef4444' : 'rgba(255,255,255,0.5)'} strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            {error && <p style={{ fontFamily: 'DM Mono', fontSize: '11px', color: '#f87171', marginTop: '8px', paddingLeft: '22px' }}>{error}</p>}
          </div>
          <button className="ip-btn" onClick={handleSubmit} disabled={loading || !input.trim()}>
            {loading ? 'Analysing...' : 'Analyse →'}
          </button>
        </div>

        <div className={`ip-fade d2 ${mounted ? 'show' : ''}`} style={{ marginTop: '20px' }}>
          <p style={{ fontFamily: 'DM Mono', fontSize: '10px', color: 'rgba(255,255,255,0.18)', letterSpacing: '0.12em', marginBottom: '10px', textTransform: 'uppercase' }}>
            Try asking
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
            {suggestions.map((s, i) => (
              <button key={i} className="ip-chip" onClick={() => setInput(s.query)}>{s.label}</button>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}