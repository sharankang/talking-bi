import { useState } from 'react'

export default function SqlPanel({ sqlUsed }) {
  const [open, setOpen] = useState(false)
  if (!sqlUsed || sqlUsed.length === 0) return null

  return (
    <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: '12px', marginBottom: '24px', overflow: 'hidden' }}>
      <button onClick={() => setOpen(!open)} style={{
        width: '100%', padding: '14px 18px', background: 'none', border: 'none',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        color: '#8b949e', fontFamily: 'Space Mono', fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase',
        transition: 'color 0.15s',
      }}
        onMouseEnter={e => e.currentTarget.style.color = '#00d2ff'}
        onMouseLeave={e => e.currentTarget.style.color = '#8b949e'}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <rect x="1" y="1" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M3.5 4.5l2 2-2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="7" y1="8.5" x2="9" y2="8.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          SQL behind KPIs — {sqlUsed.length} queries
        </span>
        <span style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none', fontSize: '10px' }}>▾</span>
      </button>

      {open && (
        <div style={{ borderTop: '1px solid #21262d' }}>
          {sqlUsed.map((item, i) => (
            <div key={i} style={{ padding: '14px 18px', borderBottom: i < sqlUsed.length - 1 ? '1px solid #21262d' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ width: '18px', height: '18px', borderRadius: '4px', background: 'rgba(0,210,255,0.1)', border: '1px solid rgba(0,210,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: '#00d2ff', fontFamily: 'Space Mono', flexShrink: 0 }}>
                  {i + 1}
                </span>
                <p style={{ fontFamily: 'Space Mono', fontSize: '10px', color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
                  {item.label}
                </p>
              </div>
              <pre style={{ background: '#0d1117', border: '1px solid #21262d', borderRadius: '8px', padding: '10px 14px', fontSize: '11px', fontFamily: 'Space Mono', color: '#3fb950', overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0, lineHeight: 1.6 }}>
                {item.sql}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}