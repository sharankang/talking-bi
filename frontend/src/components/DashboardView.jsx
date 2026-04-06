import { useState, useRef } from 'react'
import KpiCards from './KpiCards'
import DashboardTabs from './DashboardTabs'
import SqlPanel from './SqlPanel'
import ChatPanel from './ChatPanel'

export default function DashboardView({ session, onNew }) {
  const [chatOpen, setChatOpen] = useState(false)
  const printRef = useRef()

  const handlePdf = () => {
    window.print()
  }

  const tabs = session.dashboard_tabs || session.tabs || []
  const kpiCards = session.kpi_cards || []
  const sqlUsed = session.sql_used || []

  return (
    <div style={{ minHeight: '100vh', padding: '24px 32px' }} ref={printRef}>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; color: black !important; }
        }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', gap: '16px' }} className="no-print">
        <div>
          <button
            onClick={onNew}
            style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'rgba(255,255,255,0.5)', padding: '6px 12px', fontSize: '12px', cursor: 'pointer', fontFamily: 'DM Sans', marginBottom: '10px' }}
          >
            ← New analysis
          </button>
          <h2 style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '20px', color: 'white', marginBottom: '4px' }}>
            {session.query}
          </h2>
          {session.summary && (
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', fontFamily: 'DM Sans' }}>{session.summary}</p>
          )}
        </div>
        <button
          onClick={handlePdf}
          style={{
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px', color: 'rgba(255,255,255,0.6)', padding: '8px 16px',
            fontSize: '13px', cursor: 'pointer', fontFamily: 'DM Sans', flexShrink: 0,
            display: 'flex', alignItems: 'center', gap: '6px',
          }}
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M6.5 1v8M3 6l3.5 3.5L10 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M1 10v1a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          Download PDF
        </button>
      </div>

      {/* KPI cards */}
      <KpiCards cards={kpiCards} />

      {/* Dashboard tabs */}
      <DashboardTabs tabs={tabs} />

      {/* SQL panel */}
      <SqlPanel sqlUsed={sqlUsed} />

      {/* Floating chat button */}
      <button
        onClick={() => setChatOpen(!chatOpen)}
        className="no-print"
        style={{
          position: 'fixed', bottom: '24px', right: '24px',
          width: '52px', height: '52px', borderRadius: '50%',
          background: '#6366f1', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(99,102,241,0.4)', zIndex: 100,
        }}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M18 10c0 4.4-3.6 8-8 8a8 8 0 0 1-4-1.1L2 18l1.1-4A8 8 0 1 1 18 10Z" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Chat panel */}
      {chatOpen && (
        <ChatPanel
          dashboardContext={{ query: session.query, kpi_cards: kpiCards, tabs }}
          onClose={() => setChatOpen(false)}
        />
      )}
    </div>
  )
}