import { useState, useRef } from 'react'
import { exploreData, uploadFile } from '../api'

export default function ConnectionScreen({ onConnected }) {
  const [mode, setMode] = useState('url')
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [uploadedFile, setUploadedFile] = useState(null)
  const fileRef = useRef()

  const handleConnect = async () => {
    if (!url.trim()) return
    setLoading(true); setError('')
    try {
      const res = await exploreData(url.trim())
      const exp = res.data.exploration
      const samples = res.data.samples || {}
      let preview = []
      for (const table of Object.keys(samples)) {
        if (samples[table]?.length > 0) { preview = samples[table].slice(0, 6); break }
      }
      onConnected({ url: url.trim(), source: 'postgresql', preview, exploration: exp, databaseLabel: res.data.database_label })
    } catch (e) {
      setError(e.response?.data?.detail || 'Could not connect. Check your connection string.')
    } finally { setLoading(false) }
  }

  const handleUpload = async (file) => {
    if (!file) return
    setUploadedFile(file); setLoading(true); setError('')
    try {
      const res = await uploadFile(file)
      const expRes = await exploreData(res.data.db_url)
      const exp = expRes.data.exploration
      onConnected({ url: res.data.db_url, source: `csv:${file.name}`, preview: res.data.preview || [], exploration: exp, databaseLabel: file.name.replace(/\.[^.]+$/, '') })
    } catch (e) {
      setError(e.response?.data?.detail || 'Upload failed.')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', position: 'relative', overflow: 'hidden', background: '#0d1117' }}>
      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        .conn-input { width:100%;background:rgba(255,255,255,0.04);border:1px solid #30363d;border-radius:8px;padding:10px 14px;color:#e6edf3;font-family:'Space Mono',monospace;font-size:12px;outline:none;transition:border-color 0.2s; }
        .conn-input:focus { border-color:#00d2ff; }
        .conn-input::placeholder { color:#6e7681; }
        .conn-btn { width:100%;padding:12px;background:linear-gradient(135deg,#00d2ff,#7b2ff7);border:none;border-radius:8px;color:white;font-family:'Space Grotesk',sans-serif;font-size:14px;font-weight:600;cursor:pointer;transition:opacity 0.2s;margin-top:10px; }
        .conn-btn:hover:not(:disabled) { opacity:0.9; }
        .conn-btn:disabled { opacity:0.4;cursor:not-allowed; }
        .mode-tab { padding:8px 16px;background:none;border:none;border-bottom:2px solid transparent;color:#6e7681;font-family:'Space Grotesk',sans-serif;font-size:12px;font-weight:500;cursor:pointer;transition:all 0.15s; }
        .mode-tab.active { border-bottom-color:#00d2ff;color:#00d2ff; }
        .upload-zone { border:1.5px dashed #30363d;border-radius:10px;padding:32px;text-align:center;cursor:pointer;transition:all 0.2s; }
        .upload-zone:hover { border-color:#00d2ff;background:rgba(0,210,255,0.04); }
        .grid-bg { position:absolute;inset:0;background-image:linear-gradient(rgba(0,210,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(0,210,255,0.03) 1px,transparent 1px);background-size:40px 40px;pointer-events:none; }
        .glow1 { position:absolute;top:-200px;left:20%;width:600px;height:500px;background:radial-gradient(ellipse,rgba(0,210,255,0.06) 0%,transparent 70%);pointer-events:none; }
        .glow2 { position:absolute;bottom:-150px;right:10%;width:400px;height:400px;background:radial-gradient(ellipse,rgba(123,47,247,0.06) 0%,transparent 70%);pointer-events:none; }
      `}</style>

      <div className="grid-bg"/>
      <div className="glow1"/>
      <div className="glow2"/>

      <div style={{ width: '100%', maxWidth: '460px', position: 'relative', zIndex: 1 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'linear-gradient(135deg,#00d2ff,#7b2ff7)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', animation: 'float 3s ease-in-out infinite' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="2" width="9" height="9" rx="2" fill="white"/>
              <rect x="13" y="2" width="9" height="9" rx="2" fill="white" opacity="0.7"/>
              <rect x="2" y="13" width="9" height="9" rx="2" fill="white" opacity="0.7"/>
              <rect x="13" y="13" width="9" height="9" rx="2" fill="white"/>
            </svg>
          </div>
          <h1 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '2rem', color: '#e6edf3', margin: '0 0 8px' }}>
            Talking <span style={{ background: 'linear-gradient(135deg,#00d2ff,#7b2ff7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>BI</span>
          </h1>
          <p style={{ fontFamily: 'Space Grotesk', fontSize: '14px', color: '#6e7681', fontWeight: 400 }}>
            Connect your database. Ask questions. Get dashboards.
          </p>
        </div>

        {/* Card */}
        <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: '14px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid #21262d', padding: '0 4px' }}>
            <button className={`mode-tab ${mode === 'url' ? 'active' : ''}`} onClick={() => setMode('url')}>PostgreSQL URL</button>
            <button className={`mode-tab ${mode === 'csv' ? 'active' : ''}`} onClick={() => setMode('csv')}>Upload CSV / Excel</button>
          </div>

          <div style={{ padding: '20px' }}>
            {mode === 'url' ? (
              <>
                <label style={{ fontFamily: 'Space Mono', fontSize: '10px', color: '#6e7681', letterSpacing: '0.1em', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>
                  Connection string
                </label>
                <input className="conn-input" type="password"
                  placeholder="postgresql://user:password@host:5432/database"
                  value={url} onChange={e => setUrl(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleConnect()}
                />
                <p style={{ fontFamily: 'Space Grotesk', fontSize: '11px', color: '#6e7681', marginTop: '8px', lineHeight: 1.5 }}>
                  Compatible with Supabase, Neon, Railway, or any PostgreSQL instance.<br/>
                  Your connection string is never stored.
                </p>
                {error && <p style={{ fontFamily: 'Space Mono', fontSize: '11px', color: '#f85149', marginTop: '8px' }}>{error}</p>}
                <button className="conn-btn" onClick={handleConnect} disabled={loading || !url.trim()}>
                  {loading ? 'Connecting...' : 'Connect →'}
                </button>
              </>
            ) : (
              <>
                <input type="file" ref={fileRef} accept=".csv,.xlsx,.xls" style={{ display: 'none' }} onChange={e => handleUpload(e.target.files[0])}/>
                <div className="upload-zone" onClick={() => fileRef.current?.click()}>
                  {loading ? (
                    <p style={{ fontFamily: 'Space Grotesk', fontSize: '13px', color: '#6e7681' }}>Uploading & analysing...</p>
                  ) : uploadedFile ? (
                    <p style={{ fontFamily: 'Space Mono', fontSize: '12px', color: '#3fb950' }}>✓ {uploadedFile.name}</p>
                  ) : (
                    <>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" style={{ margin: '0 auto 12px', display: 'block' }}>
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="#6e7681" strokeWidth="1.5" strokeLinecap="round"/>
                        <polyline points="17 8 12 3 7 8" stroke="#6e7681" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <line x1="12" y1="3" x2="12" y2="15" stroke="#6e7681" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                      <p style={{ fontFamily: 'Space Grotesk', fontSize: '13px', color: '#8b949e', marginBottom: '4px' }}>Drop a CSV or Excel file here</p>
                      <p style={{ fontFamily: 'Space Mono', fontSize: '10px', color: '#6e7681' }}>or click to browse · max 10,000 rows</p>
                    </>
                  )}
                </div>
                {error && <p style={{ fontFamily: 'Space Mono', fontSize: '11px', color: '#f85149', marginTop: '8px' }}>{error}</p>}
              </>
            )}
          </div>
        </div>

        {/* Supabase hint */}
        <div style={{ marginTop: '14px', padding: '12px 16px', background: '#161b22', border: '1px solid #21262d', borderRadius: '10px' }}>
          <p style={{ fontFamily: 'Space Mono', fontSize: '9px', color: '#6e7681', letterSpacing: '0.08em', marginBottom: '6px', textTransform: 'uppercase' }}>How to find your Supabase URL</p>
          <p style={{ fontFamily: 'Space Grotesk', fontSize: '12px', color: '#8b949e', lineHeight: 1.6 }}>
            Project Settings → Database → Connection string → URI → Transaction mode (port 6543)
          </p>
        </div>
      </div>
    </div>
  )
}