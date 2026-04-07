import { useState, useRef } from 'react'
import { exploreData, uploadFile } from '../api'

export default function ConnectionScreen({ onConnected }) {
  const [mode, setMode] = useState('url') // 'url' | 'csv'
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [uploadFile_, setUploadFile_] = useState(null)
  const fileRef = useRef()

  const handleConnect = async () => {
    if (!url.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await exploreData(url.trim())
      const exp = res.data.exploration
      const samples = res.data.samples || {}

      // get preview from first table with data
      let preview = []
      for (const table of Object.keys(samples)) {
        if (samples[table] && samples[table].length > 0) {
          preview = samples[table].slice(0, 6)
          break
        }
      }

      onConnected({
        url: url.trim(),
        source: 'postgresql',
        preview,
        exploration: exp,
      })
    } catch (e) {
      setError(e.response?.data?.detail || 'Could not connect. Check your URL.')
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (file) => {
    if (!file) return
    setUploadFile_(file)
    setLoading(true)
    setError('')
    try {
      const res = await uploadFile(file)
      const data = res.data

      // now explore the uploaded table
      const expRes = await exploreData(data.db_url)
      const exp = expRes.data.exploration

      onConnected({
        url: data.db_url,
        source: `csv:${file.name}`,
        preview: data.preview || [],
        exploration: exp,
      })
    } catch (e) {
      setError(e.response?.data?.detail || 'Upload failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&family=DM+Mono:wght@400;500&family=Syne:wght@700;800&display=swap');
        .dot-grid{position:absolute;inset:0;background-image:radial-gradient(circle,rgba(255,255,255,0.04) 1px,transparent 1px);background-size:28px 28px;pointer-events:none;}
        .amb{position:absolute;top:-150px;left:50%;transform:translateX(-50%);width:500px;height:400px;background:radial-gradient(ellipse,rgba(251,191,36,0.08) 0%,transparent 70%);pointer-events:none;}
        .conn-input{width:100%;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:11px 14px;color:white;font-family:'DM Mono',monospace;font-size:12px;outline:none;transition:border-color 0.2s;}
        .conn-input:focus{border-color:rgba(251,191,36,0.4);}
        .conn-input::placeholder{color:rgba(255,255,255,0.2);}
        .conn-btn{width:100%;padding:13px;background:#fbbf24;border:none;border-radius:10px;color:#0a0a0a;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:500;cursor:pointer;transition:background 0.2s;margin-top:10px;}
        .conn-btn:hover:not(:disabled){background:#f59e0b;}
        .conn-btn:disabled{opacity:0.4;cursor:not-allowed;}
        .mode-tab{padding:7px 16px;background:none;border:none;border-bottom:2px solid transparent;color:rgba(255,255,255,0.35);font-family:'DM Mono',monospace;font-size:11px;cursor:pointer;letter-spacing:0.06em;text-transform:uppercase;transition:all 0.15s;}
        .mode-tab.active{border-bottom-color:#fbbf24;color:#fbbf24;}
        .upload-zone{border:1.5px dashed rgba(255,255,255,0.1);border-radius:10px;padding:28px;text-align:center;cursor:pointer;transition:all 0.2s;}
        .upload-zone:hover{border-color:rgba(251,191,36,0.35);background:rgba(251,191,36,0.04);}
      `}</style>

      <div className="dot-grid"/>
      <div className="amb"/>

      <div style={{ width: '100%', maxWidth: '480px', position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '3rem', lineHeight: 1, letterSpacing: '-0.03em', color: 'white', margin: 0 }}>
            Talking <span style={{ color: '#fbbf24' }}>BI</span>
          </h1>
          <p style={{ fontFamily: 'DM Sans', fontSize: '14px', color: 'rgba(255,255,255,0.3)', marginTop: '10px', fontWeight: 300 }}>
            Connect your database to get started
          </p>
        </div>

        {/* Card */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', overflow: 'hidden' }}>

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '0 4px' }}>
            <button className={`mode-tab ${mode === 'url' ? 'active' : ''}`} onClick={() => setMode('url')}>
              PostgreSQL URL
            </button>
            <button className={`mode-tab ${mode === 'csv' ? 'active' : ''}`} onClick={() => setMode('csv')}>
              Upload CSV / Excel
            </button>
          </div>

          <div style={{ padding: '20px' }}>
            {mode === 'url' ? (
              <>
                <p style={{ fontFamily: 'DM Mono', fontSize: '10px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em', marginBottom: '8px', textTransform: 'uppercase' }}>
                  Connection string
                </p>
                <input
                  className="conn-input"
                  type="password"
                  placeholder="postgresql://user:password@host:5432/database"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleConnect()}
                />
                <p style={{ fontFamily: 'DM Sans', fontSize: '11px', color: 'rgba(255,255,255,0.2)', marginTop: '8px' }}>
                  Works with Supabase, Neon, Railway, or any PostgreSQL instance.
                  <br />Your connection string is never stored — only used in your session.
                </p>
                {error && <p style={{ fontFamily: 'DM Mono', fontSize: '11px', color: '#f87171', marginTop: '8px' }}>{error}</p>}
                <button className="conn-btn" onClick={handleConnect} disabled={loading || !url.trim()}>
                  {loading ? 'Connecting...' : 'Connect →'}
                </button>
              </>
            ) : (
              <>
                <input type="file" ref={fileRef} accept=".csv,.xlsx,.xls" style={{ display: 'none' }} onChange={e => handleUpload(e.target.files[0])} />
                <div className="upload-zone" onClick={() => fileRef.current?.click()}>
                  {loading ? (
                    <p style={{ fontFamily: 'DM Mono', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                      Uploading & analysing...
                    </p>
                  ) : uploadFile_ ? (
                    <p style={{ fontFamily: 'DM Mono', fontSize: '12px', color: '#10b981' }}>
                      ✓ {uploadFile_.name}
                    </p>
                  ) : (
                    <>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" style={{ margin: '0 auto 10px' }}>
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round"/>
                        <polyline points="17 8 12 3 7 8" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <line x1="12" y1="3" x2="12" y2="15" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                      <p style={{ fontFamily: 'DM Sans', fontSize: '13px', color: 'rgba(255,255,255,0.35)', marginBottom: '4px' }}>
                        Drop a CSV or Excel file
                      </p>
                      <p style={{ fontFamily: 'DM Mono', fontSize: '10px', color: 'rgba(255,255,255,0.18)' }}>
                        or click to browse · max 10,000 rows
                      </p>
                    </>
                  )}
                </div>
                {error && <p style={{ fontFamily: 'DM Mono', fontSize: '11px', color: '#f87171', marginTop: '8px' }}>{error}</p>}
              </>
            )}
          </div>
        </div>

        {/* Help text */}
        <div style={{ marginTop: '20px', padding: '14px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px' }}>
          <p style={{ fontFamily: 'DM Mono', fontSize: '10px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.08em', marginBottom: '8px', textTransform: 'uppercase' }}>
            How to find your Supabase connection string
          </p>
          <p style={{ fontFamily: 'DM Sans', fontSize: '12px', color: 'rgba(255,255,255,0.3)', lineHeight: 1.6 }}>
            Supabase → Project Settings → Database → Connection string → URI tab → Transaction mode (port 6543)
          </p>
        </div>
      </div>
    </div>
  )
}