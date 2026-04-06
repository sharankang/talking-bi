import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import InputPanel from './components/InputPanel'
import DashboardView from './components/DashboardView'
import { getSessions, saveSession } from './api'

export default function App() {
  const [sessions, setSessions] = useState([])
  const [activeSession, setActiveSession] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchSessions()
  }, [])

  const fetchSessions = async () => {
    try {
      const res = await getSessions()
      setSessions(res.data.sessions || [])
    } catch (e) {
      console.error('Could not load sessions', e)
    }
  }

  const handleAnalysis = async (result, query) => {
    try {
      const saved = await saveSession({
        query,
        summary: result.summary,
        kpi_cards: result.kpi_cards,
        dashboard_tabs: result.tabs,
        sql_used: result.sql_used,
      })
      const newSession = {
        ...saved.data.session,
        kpi_cards: result.kpi_cards,
        dashboard_tabs: result.tabs,
        sql_used: result.sql_used,
      }
      setActiveSession(newSession)
      fetchSessions()
    } catch (e) {
      setActiveSession({
        query,
        summary: result.summary,
        kpi_cards: result.kpi_cards,
        dashboard_tabs: result.tabs,
        sql_used: result.sql_used,
      })
    }
  }

  const handleSelectSession = async (session) => {
    try {
      const { getSession } = await import('./api')
      const res = await getSession(session.id)
      setActiveSession(res.data.session)
    } catch (e) {
      console.error(e)
    }
  }

  const handleNewAnalysis = () => {
    setActiveSession(null)
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#070b14' }}>
      <Sidebar
        sessions={sessions}
        activeSession={activeSession}
        onSelect={handleSelectSession}
        onNew={handleNewAnalysis}
        onRefresh={fetchSessions}
      />
      <main style={{ flex: 1, overflowY: 'auto' }}>
        {!activeSession ? (
          <InputPanel
            onResult={handleAnalysis}
            loading={loading}
            setLoading={setLoading}
          />
        ) : (
          <DashboardView
            session={activeSession}
            onNew={handleNewAnalysis}
          />
        )}
      </main>
    </div>
  )
}