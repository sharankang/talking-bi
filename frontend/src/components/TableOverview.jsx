import { useState } from 'react'

export default function TableOverview({ tableOverview }) {
  const [open, setOpen] = useState(true)
  if (!tableOverview || !tableOverview.rows || tableOverview.rows.length === 0) return null

  const { table, columns, rows } = tableOverview

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
            <rect x="1" y="1" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
            <line x1="1" y1="4" x2="11" y2="4" stroke="currentColor" strokeWidth="1.2"/>
            <line x1="4" y1="4" x2="4" y2="11" stroke="currentColor" strokeWidth="1.2"/>
          </svg>
          Table preview — {table} · {rows.length} rows shown
        </span>
        <span style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none', fontSize: '10px' }}>▾</span>
      </button>

      {open && (
        <div style={{ borderTop: '1px solid #21262d', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', fontFamily: 'Space Mono', minWidth: '600px' }}>
            <thead>
              <tr style={{ background: 'rgba(0,210,255,0.04)' }}>
                {columns.map((col, i) => (
                  <th key={i} style={{ padding: '10px 14px', textAlign: 'left', color: '#00d2ff', fontWeight: 500, fontSize: '10px', letterSpacing: '0.06em', textTransform: 'uppercase', borderBottom: '1px solid #21262d', whiteSpace: 'nowrap' }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #161b22' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {columns.map((col, j) => (
                    <td key={j} style={{ padding: '9px 14px', color: '#c9d1d9', whiteSpace: 'nowrap', overflow: 'hidden', maxWidth: '200px', textOverflow: 'ellipsis', fontSize: '11px' }}>
                      {row[col] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}