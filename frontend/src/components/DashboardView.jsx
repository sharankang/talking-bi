import { useState, useRef } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import KpiCards from './KpiCards'
import DashboardTabs from './DashboardTabs'
import TableOverview from './TableOverview'
import SqlPanel from './SqlPanel'
import ChatPanel from './ChatPanel'

export default function DashboardView({ session, onNew, dbUrl }) {
  const [chatOpen, setChatOpen] = useState(false)
  const [exporting, setExporting] = useState(false)
  const exportRef = useRef()

  const handlePdf = async () => {
    setExporting(true)
    try {
      const el = exportRef.current
      const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#0d1117', useCORS: true, logging: false })
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: 'a4' })
      const pdfW = pdf.internal.pageSize.getWidth()
      const pdfH = pdf.internal.pageSize.getHeight()
      const ratio = pdfW / canvas.width
      const scaledH = canvas.height * ratio
      let y = 0
      while (y < scaledH) {
        if (y > 0) pdf.addPage()
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, -y, pdfW, scaledH)
        y += pdfH
      }
      pdf.save(`talking_bi_${session.query.slice(0, 30).replace(/[^a-z0-9]/gi, '_')}.pdf`)
    } catch (e) { console.error(e) }
    finally { setExporting(false) }
  }

  const tabs = session.dashboard_tabs || session.tabs || []
  const kpiCards = session.kpi_cards || []
  const sqlUsed = session.sql_used || []
  const tableOverview = session.table_overview || null

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <div style={{ flex: 1, padding: '24px 28px', overflowY: 'auto', minWidth: 0 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', gap: '16px' }}>
          <div>
            <button onClick={onNew} style={{ background: 'none', border: '1px solid #30363d', borderRadius: '7px', color: '#6e7681', padding: '5px 11px', fontSize: '12px', cursor: 'pointer', fontFamily: 'Space Grotesk', marginBottom: '10px', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#00d2ff'; e.currentTarget.style.color = '#00d2ff' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#30363d'; e.currentTarget.style.color = '#6e7681' }}>
              ← New analysis
            </button>
            <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '18px', color: '#e6edf3', marginBottom: '4px' }}>
              {session.query}
            </h2>
            {session.summary && <p style={{ fontSize: '12px', color: '#6e7681', fontFamily: 'Space Grotesk' }}>{session.summary}</p>}
          </div>
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            <button onClick={() => setChatOpen(!chatOpen)} style={{
              padding: '7px 14px', borderRadius: '8px', cursor: 'pointer', fontFamily: 'Space Grotesk', fontSize: '12px', fontWeight: 500,
              background: chatOpen ? 'rgba(0,210,255,0.12)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${chatOpen ? 'rgba(0,210,255,0.3)' : '#30363d'}`,
              color: chatOpen ? '#00d2ff' : '#8b949e',
              display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.15s',
            }}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M11.5 6.5a5 5 0 1 1-9.3 2.5L1 11.5l2.5-1.2A5 5 0 1 1 11.5 6.5Z" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {chatOpen ? 'Close chat' : 'Ask AI'}
            </button>
            <button onClick={handlePdf} disabled={exporting} style={{ padding: '7px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid #30363d', borderRadius: '8px', color: '#8b949e', fontSize: '12px', cursor: exporting ? 'not-allowed' : 'pointer', fontFamily: 'Space Grotesk', display: 'flex', alignItems: 'center', gap: '6px', opacity: exporting ? 0.5 : 1 }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 1v7M3 5.5l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M1 9.5v.5a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
              {exporting ? 'Exporting...' : 'PDF'}
            </button>
          </div>
        </div>

        <div ref={exportRef}>
          <KpiCards cards={kpiCards} />
          <DashboardTabs tabs={tabs} />
          <TableOverview tableOverview={tableOverview} />
          <SqlPanel sqlUsed={sqlUsed} />
        </div>
      </div>

      {chatOpen && (
        <div style={{ width: '340px', minHeight: '100vh', background: '#161b22', borderLeft: '1px solid #21262d', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
          <ChatPanel dashboardContext={{ query: session.query, kpi_cards: kpiCards, tabs }} inline dbUrl={dbUrl} />
        </div>
      )}
    </div>
  )
}