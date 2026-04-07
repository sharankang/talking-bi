import { useState } from 'react'
import { deleteSession } from '../api'

export default function Sidebar({ sessions, activeSession, onSelect, onNew, onRefresh, connected, dbSource, onDisconnect }) {
  const [collapsed, setCollapsed] = useState(false)

  const handleDelete = async (e, id) => {
    e.stopPropagation()
    try {
      await deleteSession(id)
      onRefresh()
    } catch (err) {
      console.error(err)
    }
  }

  const formatDate = (ts) => {
    if (!ts) return ''
    return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const isCsv = dbSource?.startsWith('csv:')
  const sourceLabel = isCsv ? dbSource.replace('csv:', '') : dbSource === 'postgresql' ? 'PostgreSQL' : null

  return (
    <div style={{
      width: collapsed ? '52px' : '240px',
      minHeight: '100vh',
      background: 'rgba(255,255,255,0.02)',
      borderRight: '1px solid rgba(255,255,255,0.06)',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.25s ease',
      flexShrink: 0,
    }}>

      {/* Top */}
      <div style={{ padding: '16px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        {!collapsed && (
          <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '16px', color: 'white', whiteSpace: 'nowrap' }}>
            Talking <span style={{ color: '#6366f1' }}>BI</span>
          </span>
        )}
        <button onClick={() => setCollapsed(!collapsed)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: '4px', flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="1" y="3" width="14" height="1.5" rx="1" fill="currentColor"/>
            <rect x="1" y="7.25" width="14" height="1.5" rx="1" fill="currentColor"/>
            <rect x="1" y="11.5" width="14" height="1.5" rx="1" fill="currentColor"/>
          </svg>
        </button>
      </div>

      {/* Connected badge */}
      {!collapsed && connected && sourceLabel && (
        <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px rgba(16,185,129,0.5)', flexShrink: 0 }}/>
            <span style={{ fontFamily: 'DM Mono', fontSize: '10px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {sourceLabel}
            </span>
          </div>
          <button
            onClick={onDisconnect}
            style={{ fontFamily: 'DM Mono', fontSize: '10px', color: 'rgba(255,255,255,0.2)', background: 'none', border: 'none', cursor: 'pointer', padding: '0', letterSpacing: '0.06em' }}
            onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.2)'}
          >
            Disconnect
          </button>
        </div>
      )}

      {/* New analysis */}
      <div style={{ padding: '10px 8px' }}>
        <button
          onClick={onNew}
          style={{ width: '100%', padding: collapsed ? '8px' : '8px 12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: 'rgba(255,255,255,0.5)', fontFamily: 'DM Sans', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start', gap: '8px', transition: 'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.4)'; e.currentTarget.style.color = '#fbbf24' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}
        >
          <span style={{ fontSize: '16px', lineHeight: 1, color: '#fbbf24' }}>+</span>
          {!collapsed && <span>New analysis</span>}
        </button>
      </div>

      {/* History */}
      {!collapsed && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 16px' }}>
          {sessions.length === 0 ? (
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', padding: '12px 4px', fontFamily: 'DM Mono' }}>No sessions yet</p>
          ) : (
            <>
              <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', padding: '8px 4px 6px', fontFamily: 'DM Mono', letterSpacing: '0.1em', textTransform: 'uppercase' }}>History</p>
              {sessions.map(s => (
                <div
                  key={s.id}
                  onClick={() => onSelect(s)}
                  style={{ padding: '8px 10px', borderRadius: '8px', cursor: 'pointer', background: activeSession?.id === s.id ? 'rgba(251,191,36,0.08)' : 'transparent', border: `1px solid ${activeSession?.id === s.id ? 'rgba(251,191,36,0.2)' : 'transparent'}`, marginBottom: '2px', transition: 'all 0.15s' }}
                  onMouseEnter={e => { if (activeSession?.id !== s.id) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                  onMouseLeave={e => { if (activeSession?.id !== s.id) e.currentTarget.style.background = 'transparent' }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '6px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '2px' }}>
                        {s.query}
                      </p>
                      <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)', fontFamily: 'DM Mono' }}>
                        {formatDate(s.created_at)}
                      </p>
                      {/* Dataset preview indicator */}
                      {s.db_source && (
                        <p style={{ fontSize: '10px', color: 'rgba(251,191,36,0.4)', fontFamily: 'DM Mono', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {s.db_source.startsWith('csv:') ? s.db_source.replace('csv:', '') : 'PostgreSQL'}
                        </p>
                      )}
                      {s.schema_summary && (
                        <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', fontFamily: 'DM Sans', marginTop: '2px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {s.schema_summary}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={(e) => handleDelete(e, s.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.2)', fontSize: '14px', flexShrink: 0, lineHeight: 1, padding: '2px' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
                      onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.2)'}
                    >
                      ×
                    </button>
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