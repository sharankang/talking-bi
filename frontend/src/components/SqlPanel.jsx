import { useState } from 'react'

export default function SqlPanel({ sqlUsed }) {
  const [open, setOpen] = useState(false)
  if (!sqlUsed || sqlUsed.length === 0) return null

  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: '12px',
      marginBottom: '24px',
      overflow: 'hidden',
    }} className="no-print">
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', padding: '14px 18px',
          background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          color: 'rgba(255,255,255,0.4)', fontFamily: 'DM Mono', fontSize: '11px',
          letterSpacing: '0.08em', textTransform: 'uppercase',
          transition: 'color 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.color = '#fbbf24'}
        onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <rect x="1" y="1" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M3.5 4.5l2 2-2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="7" y1="8.5" x2="9" y2="8.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          SQL & KPIs used — {sqlUsed.length} queries
        </span>
        <span style={{
          transition: 'transform 0.2s',
          transform: open ? 'rotate(180deg)' : 'none',
          fontSize: '10px',
        }}>▾</span>
      </button>

      {open && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {sqlUsed.map((item, i) => (
            <div key={i} style={{
              padding: '14px 18px',
              borderBottom: i < sqlUsed.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{
                  width: '18px', height: '18px', borderRadius: '4px',
                  background: 'rgba(251,191,36,0.12)',
                  border: '1px solid rgba(251,191,36,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '9px', color: '#fbbf24', fontFamily: 'DM Mono', flexShrink: 0,
                }}>
                  {i + 1}
                </span>
                <p style={{
                  fontFamily: 'DM Mono', fontSize: '11px',
                  color: 'rgba(255,255,255,0.5)',
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                  margin: 0,
                }}>
                  {item.label}
                </p>
              </div>
              <pre style={{
                background: 'rgba(0,0,0,0.25)',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: '8px',
                padding: '10px 14px',
                fontSize: '11px',
                fontFamily: 'DM Mono',
                color: 'rgba(255,255,255,0.55)',
                overflowX: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                margin: 0,
                lineHeight: 1.6,
              }}>
                {item.sql}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}