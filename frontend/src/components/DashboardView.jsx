import { useState, useRef } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import KpiCards from './KpiCards'
import DashboardTabs from './DashboardTabs'
import SqlPanel from './SqlPanel'
import ChatPanel from './ChatPanel'

export default function DashboardView({ session, onNew, dbUrl }) {
  const [chatOpen, setChatOpen] = useState(false)
  const [exporting, setExporting] = useState(false)
  const exportRef = useRef()

  const handlePdf = async () => {
    setExporting(true)
    try {
      const element = exportRef.current
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#070b14',
        useCORS: true,
        logging: false,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: 'a4',
      })

      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const canvasWidth = canvas.width
      const canvasHeight = canvas.height
      const ratio = pdfWidth / canvasWidth
      const scaledHeight = canvasHeight * ratio

      // split into pages if content is taller than one page
      let yOffset = 0
      while (yOffset < scaledHeight) {
        if (yOffset > 0) pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, -yOffset, pdfWidth, scaledHeight)
        yOffset += pdfHeight
      }

      const filename = session.query.slice(0, 40).replace(/[^a-z0-9]/gi, '_').toLowerCase()
      pdf.save(`talking_bi_${filename}.pdf`)
    } catch (e) {
      console.error('PDF export failed:', e)
    } finally {
      setExporting(false)
    }
  }

  const tabs = session.dashboard_tabs || session.tabs || []
  const kpiCards = session.kpi_cards || []
  const sqlUsed = session.sql_used || []

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <style>{`@media print { .no-print { display: none !important; } }`}</style>

      <div style={{ flex: 1, padding: '28px 32px', overflowY: 'auto', minWidth: 0 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', gap: '16px' }} className="no-print">
          <div>
            <button onClick={onNew} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '7px', color: 'rgba(255,255,255,0.4)', padding: '5px 11px', fontSize: '12px', cursor: 'pointer', fontFamily: 'DM Sans', marginBottom: '10px' }}>
              ← New analysis
            </button>
            <h2 style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '18px', color: 'white', marginBottom: '4px' }}>
              {session.query}
            </h2>
            {session.summary && (
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', fontFamily: 'DM Sans' }}>{session.summary}</p>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }} className="no-print">
            <button
              onClick={() => setChatOpen(!chatOpen)}
              style={{
                padding: '7px 14px',
                background: chatOpen ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${chatOpen ? 'rgba(251,191,36,0.3)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: '8px',
                color: chatOpen ? '#fbbf24' : 'rgba(255,255,255,0.5)',
                fontSize: '12px', cursor: 'pointer', fontFamily: 'DM Sans',
                display: 'flex', alignItems: 'center', gap: '6px',
              }}
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M11.5 6.5a5 5 0 1 1-9.3 2.5L1 11.5l2.5-1.2A5 5 0 1 1 11.5 6.5Z" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {chatOpen ? 'Close chat' : 'Ask AI'}
            </button>
            <button
              onClick={handlePdf}
              disabled={exporting}
              style={{
                padding: '7px 14px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                color: 'rgba(255,255,255,0.5)',
                fontSize: '12px', cursor: exporting ? 'not-allowed' : 'pointer',
                fontFamily: 'DM Sans',
                display: 'flex', alignItems: 'center', gap: '6px',
                opacity: exporting ? 0.5 : 1,
              }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 1v7M3 5.5l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M1 9.5v.5a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
              {exporting ? 'Exporting...' : 'PDF'}
            </button>
          </div>
        </div>

        {/* Exportable content area */}
        <div ref={exportRef}>
          <KpiCards cards={kpiCards} />
          <DashboardTabs tabs={tabs} />
          <SqlPanel sqlUsed={sqlUsed} />
        </div>
      </div>

      {chatOpen && (
        <div style={{
          width: '320px', minHeight: '100vh',
          background: 'rgba(255,255,255,0.02)',
          borderLeft: '1px solid rgba(255,255,255,0.07)',
          flexShrink: 0, display: 'flex', flexDirection: 'column',
        }} className="no-print">
          <ChatPanel
            dashboardContext={{ query: session.query, kpi_cards: kpiCards, tabs }}
            inline
            dbUrl={dbUrl}
          />
        </div>
      )}
    </div>
  )
}