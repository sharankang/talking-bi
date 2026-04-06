import { useState, useRef, useEffect } from 'react'
import { analyseQuery, exploreData } from '../api'
import axios from 'axios'

const FALLBACK = [
  { label: 'Revenue by category', query: 'Show me total revenue by product category' },
  { label: 'Monthly trends', query: 'Monthly order trends over time' },
  { label: 'Customer geography', query: 'Which states have the most customers?' },
  { label: 'Top products', query: 'Top 10 products by revenue' },
  { label: 'Order status', query: 'Show me the order status distribution' },
]

export default function InputPanel({ onResult, loading, setLoading }) {
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const [listening, setListening] = useState(false)
  const [exploration, setExploration] = useState(null)
  const [mounted, setMounted] = useState(false)
  const [dataMode, setDataMode] = useState('ours') // 'ours' | 'upload'
  const [uploadFile, setUploadFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadDone, setUploadDone] = useState(false)
  const recognitionRef = useRef(null)
  const fileRef = useRef(null)

  useEffect(() => {
    setTimeout(() => setMounted(true), 80)
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

  const handleUpload = async (file) => {
    if (!file) return
    setUploadFile(file)
    setUploading(true)
    setUploadDone(false)
    try {
      const formData = new FormData()
      formData.append('file', file)
      await axios.post('http://localhost:8000/upload', formData)
      setUploadDone(true)
    } catch (e) {
      setError('Upload failed. Check that your backend has the upload route.')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async () => {
    if (!input.trim() || loading) return
    if (dataMode === 'upload' && !uploadDone) {
      setError('Please upload your dataset first.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await analyseQuery(input)
      onResult(res.data, input)
    } catch {
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
      alignItems: 'center',
      justifyContent: 'center',
      padding: '3rem 2rem',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&family=DM+Mono:wght@400;500&family=Syne:wght@700;800&display=swap');
        .dot-grid{position:absolute;inset:0;background-image:radial-gradient(circle,rgba(255,255,255,0.04) 1px,transparent 1px);background-size:28px 28px;pointer-events:none;}
        .amb1{position:absolute;top:-180px;left:30%;width:480px;height:380px;background:radial-gradient(ellipse,rgba(251,191,36,0.07) 0%,transparent 70%);pointer-events:none;}
        .amb2{position:absolute;bottom:-120px;right:10%;width:360px;height:280px;background:radial-gradient(ellipse,rgba(99,102,241,0.06) 0%,transparent 70%);pointer-events:none;}
        .fade-in{opacity:0;transform:translateY(18px);transition:opacity 0.55s ease,transform 0.55s ease;}
        .fade-in.show{opacity:1;transform:translateY(0);}
        .fade-in.d1{transition-delay:0.08s;}
        .fade-in.d2{transition-delay:0.18s;}
        .fade-in.d3{transition-delay:0.28s;}
        .ip-textarea{width:100%;background:transparent;border:none;outline:none;color:rgba(255,255,255,0.85);font-family:'DM Mono',monospace;font-size:13px;line-height:1.75;resize:none;caret-color:#fbbf24;}
        .ip-textarea::placeholder{color:rgba(255,255,255,0.13);}
        .analyse-btn{width:100%;padding:13px;background:#fbbf24;border:none;border-radius:10px;color:#0a0a0a;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:500;cursor:pointer;transition:background 0.2s,transform 0.1s;margin-top:10px;}
        .analyse-btn:hover:not(:disabled){background:#f59e0b;}
        .analyse-btn:disabled{opacity:0.35;cursor:not-allowed;}
        .chip{padding:5px 12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:6px;color:rgba(255,255,255,0.38);font-family:'DM Mono',monospace;font-size:11px;cursor:pointer;transition:all 0.15s;white-space:nowrap;}
        .chip:hover{background:rgba(251,191,36,0.1);border-color:rgba(251,191,36,0.3);color:rgba(255,255,255,0.7);}
        .mode-btn{padding:6px 14px;border-radius:8px;font-family:'DM Mono',monospace;font-size:11px;cursor:pointer;transition:all 0.15s;border:1px solid rgba(255,255,255,0.08);}
        .mode-btn.active{background:rgba(251,191,36,0.15);border-color:rgba(251,191,36,0.35);color:#fbbf24;}
        .mode-btn.inactive{background:transparent;color:rgba(255,255,255,0.3);}
        .mode-btn.inactive:hover{background:rgba(255,255,255,0.04);color:rgba(255,255,255,0.5);}
        .upload-zone{border:1.5px dashed rgba(255,255,255,0.12);border-radius:10px;padding:20px;text-align:center;cursor:pointer;transition:all 0.2s;}
        .upload-zone:hover{border-color:rgba(251,191,36,0.35);background:rgba(251,191,36,0.04);}
        .sdot{width:6px;height:6px;border-radius:50%;background:#10b981;box-shadow:0 0 7px rgba(16,185,129,0.5);animation:blink 2s ease infinite;display:inline-block;}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0.3}}
      `}</style>

      <div className="dot-grid"/>
      <div className="amb1"/>
      <div className="amb2"/>

      <div style={{ width: '100%', maxWidth: '560px', position: 'relative', zIndex: 1 }}>

        {/* Header — horizontal layout, not giant centered text */}
        <div className={`fade-in ${mounted ? 'show' : ''}`} style={{ marginBottom: '2.8rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <span className="sdot"/>
            <span style={{ fontFamily: 'DM Mono', fontSize: '10px', color: 'rgba(255,255,255,0.22)', letterSpacing: '0.12em' }}>
              OLIST E-COMMERCE · LIVE
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '14px', flexWrap: 'wrap' }}>
            <h1 style={{
              fontFamily: 'Syne', fontWeight: 800,
              fontSize: 'clamp(2.4rem, 6vw, 3.4rem)',
              lineHeight: 1, letterSpacing: '-0.03em',
              color: 'white', margin: 0,
            }}>
              Talking <span style={{ color: '#fbbf24' }}>BI</span>
            </h1>
            <p style={{
              fontFamily: 'DM Sans', fontSize: '14px',
              color: 'rgba(255,255,255,0.28)',
              fontWeight: 300, fontStyle: 'italic',
              margin: 0,
            }}>
              natural language → dashboards
            </p>
          </div>
        </div>

        {/* Data source toggle */}
        <div className={`fade-in d1 ${mounted ? 'show' : ''}`} style={{ marginBottom: '14px' }}>
          <p style={{ fontFamily: 'DM Mono', fontSize: '10px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em', marginBottom: '8px', textTransform: 'uppercase' }}>
            Data source
          </p>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button className={`mode-btn ${dataMode === 'ours' ? 'active' : 'inactive'}`} onClick={() => setDataMode('ours')}>
              Olist dataset
            </button>
            <button className={`mode-btn ${dataMode === 'upload' ? 'active' : 'inactive'}`} onClick={() => setDataMode('upload')}>
              Upload my data
            </button>
          </div>
        </div>

        {/* Upload zone */}
        {dataMode === 'upload' && (
          <div className={`fade-in d1 ${mounted ? 'show' : ''}`} style={{ marginBottom: '14px' }}>
            <div
              className="upload-zone"
              onClick={() => fileRef.current?.click()}
            >
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                style={{ display: 'none' }}
                onChange={e => handleUpload(e.target.files[0])}
              />
              {uploading ? (
                <p style={{ fontFamily: 'DM Mono', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Uploading...</p>
              ) : uploadDone ? (
                <p style={{ fontFamily: 'DM Mono', fontSize: '12px', color: '#10b981' }}>
                  ✓ {uploadFile?.name} uploaded
                </p>
              ) : (
                <>
                  <p style={{ fontFamily: 'DM Sans', fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>
                    Drop a CSV or Excel file here
                  </p>
                  <p style={{ fontFamily: 'DM Mono', fontSize: '10px', color: 'rgba(255,255,255,0.2)' }}>
                    or click to browse
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Input */}
        <div className={`fade-in d2 ${mounted ? 'show' : ''}`}>
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '12px',
            padding: '14px 16px',
          }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <span style={{ fontFamily: 'DM Mono', fontSize: '13px', color: '#fbbf24', paddingTop: '2px', flexShrink: 0, opacity: 0.7 }}>›_</span>
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
                  width: '36px', height: '36px', borderRadius: '8px', border: 'none',
                  background: listening ? 'rgba(239,68,68,0.18)' : 'rgba(255,255,255,0.04)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}
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
        </div>

        {/* Suggestions */}
        <div className={`fade-in d3 ${mounted ? 'show' : ''}`} style={{ marginTop: '18px' }}>
          <p style={{ fontFamily: 'DM Mono', fontSize: '10px', color: 'rgba(255,255,255,0.16)', letterSpacing: '0.12em', marginBottom: '9px', textTransform: 'uppercase' }}>
            Try asking
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
            {suggestions.map((s, i) => (
              <button key={i} className="chip" onClick={() => setInput(s.query)}>{s.label}</button>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}