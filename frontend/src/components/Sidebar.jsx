import { useState } from 'react'
import { deleteSession } from '../api'

export default function Sidebar({ sessions, activeSession, onSelect, onNew, onRefresh, connected, dbSource, databaseLabel, onDisconnect }) {
  const [collapsed, setCollapsed] = useState(false)

  const handleDelete = async (e, id) => {
    e.stopPropagation()
    try { await deleteSession(id); onRefresh() } catch (e) { console.error(e) }
  }

  const formatDate = (ts) => {
    if (!ts) return ''
    return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const isCsv = dbSource?.startsWith('csv:')
  const sourceLabel = isCsv ? dbSource.replace('csv:', '') : databaseLabel || 'PostgreSQL'

  return (
    <div style={{
      width: collapsed ? '56px' : '240px',
      minHeight: '100vh',
      background: '#161b22',
      borderRight: '1px solid #21262d',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.2s ease',
      flexShrink: 0,
    }}>
      <style>{`
        .sb-item:hover { background: rgba(255,255,255,0.04) !important; }
      `}</style>

      {/* Logo */}
      <div style={{ padding: '16px 14px', borderBottom: '1px solid #21262d', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'linear-gradient(135deg, #00d2ff, #7b2ff7)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="1" width="5" height="5" rx="1" fill="white"/>
                <rect x="8" y="1" width="5" height="5" rx="1" fill="white" opacity="0.7"/>
                <rect x="1" y="8" width="5" height="5" rx="1" fill="white" opacity="0.7"/>
                <rect x="8" y="8" width="5" height="5" rx="1" fill="white"/>
              </svg>
            </div>
            <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '15px', color: '#e6edf3' }}>
              Talking BI
            </span>
          </div>
        )}
        <button onClick={() => setCollapsed(!collapsed)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6e7681', padding: '4px', flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect x="1" y="3" width="14" height="1.5" rx="0.75"/>
            <rect x="1" y="7.25" width="14" height="1.5" rx="0.75"/>
            <rect x="1" y="11.5" width="14" height="1.5" rx="0.75"/>
          </svg>
        </button>
      </div>

      {/* Connection badge */}
      {!collapsed && connected && (
        <div style={{ padding: '10px 14px', borderBottom: '1px solid #21262d' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#3fb950', boxShadow: '0 0 8px rgba(63,185,80,0.5)', flexShrink: 0 }}/>
            <span style={{ fontFamily: 'Space Mono', fontSize: '10px', color: '#8b949e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
              {sourceLabel}
            </span>
          </div>
          <button onClick={onDisconnect} style={{ fontFamily: 'Space Mono', fontSize: '10px', color: '#6e7681', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            onMouseEnter={e => e.currentTarget.style.color = '#f85149'}
            onMouseLeave={e => e.currentTarget.style.color = '#6e7681'}>
            Disconnect
          </button>
        </div>
      )}

      {/* New analysis */}
      <div style={{ padding: '10px 10px 8px' }}>
        <button onClick={onNew} style={{
          width: '100%', padding: collapsed ? '8px' : '8px 12px',
          background: 'rgba(0,210,255,0.08)', border: '1px solid rgba(0,210,255,0.2)',
          borderRadius: '8px', color: '#00d2ff', fontFamily: 'Space Grotesk',
          fontSize: '13px', fontWeight: 500, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start',
          gap: '7px', transition: 'all 0.15s',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,210,255,0.15)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,210,255,0.08)' }}
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <line x1="6.5" y1="1" x2="6.5" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="1" y1="6.5" x2="12" y2="6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          {!collapsed && <span>New analysis</span>}
        </button>
      </div>

      {/* History */}
      {!collapsed && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 10px 16px' }}>
          {sessions.length === 0 ? (
            <p style={{ fontFamily: 'Space Mono', fontSize: '10px', color: '#6e7681', padding: '12px 4px' }}>No sessions yet</p>
          ) : (
            <>
              <p style={{ fontFamily: 'Space Mono', fontSize: '9px', color: '#6e7681', padding: '8px 4px 6px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>History</p>
              {sessions.map(s => (
                <div key={s.id} className="sb-item" onClick={() => onSelect(s)}
                  style={{
                    padding: '8px 10px', borderRadius: '8px', cursor: 'pointer', marginBottom: '2px',
                    background: activeSession?.id === s.id ? 'rgba(0,210,255,0.08)' : 'transparent',
                    border: `1px solid ${activeSession?.id === s.id ? 'rgba(0,210,255,0.2)' : 'transparent'}`,
                    transition: 'all 0.1s',
                  }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '6px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '12px', color: '#c9d1d9', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '3px' }}>
                        {s.query}
                      </p>
                      {(s.database_label || s.db_source) && (
                        <p style={{ fontFamily: 'Space Mono', fontSize: '9px', color: '#00d2ff', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {s.database_label || (s.db_source?.startsWith('csv:') ? s.db_source.replace('csv:', '') : 'PostgreSQL')}
                        </p>
                      )}
                      {s.schema_summary && (
                        <p style={{ fontSize: '10px', color: '#6e7681', marginBottom: '2px', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {s.schema_summary}
                        </p>
                      )}
                      <p style={{ fontFamily: 'Space Mono', fontSize: '9px', color: '#6e7681' }}>
                        {formatDate(s.created_at)}
                      </p>
                    </div>
                    <button onClick={(e) => handleDelete(e, s.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6e7681', fontSize: '14px', flexShrink: 0, lineHeight: 1, padding: '2px' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#f85149'}
                      onMouseLeave={e => e.currentTarget.style.color = '#6e7681'}>×</button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}