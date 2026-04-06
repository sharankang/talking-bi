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
          color: 'rgba(255,255,255,0.5)', fontFamily: 'DM Mono', fontSize: '11px',
          letterSpacing: '0.08em', textTransform: 'uppercase',
        }}
      >
        <span>SQL & KPIs used — {sqlUsed.length} queries</span>
        <span style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }}>▾</span>
      </button>

      {open && (
        <div style={{ padding: '0 18px 16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {sqlUsed.map((item, i) => (
            <div key={i} style={{ marginTop: '14px' }}>
              <p style={{ fontFamily: 'DM Mono', fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {item.label}
              </p>
              <pre style={{
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '8px',
                padding: '10px 12px',
                fontSize: '11px',
                fontFamily: 'DM Mono',
                color: 'rgba(255,255,255,0.6)',
                overflowX: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                margin: 0,
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