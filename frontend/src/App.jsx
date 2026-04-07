import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import ConnectionScreen from './components/ConnectionScreen'
import InputPanel from './components/InputPanel'
import DashboardView from './components/DashboardView'
import { getSessions, saveSession, getSession } from './api'

export default function App() {
  const [sessions, setSessions] = useState([])
  const [activeSession, setActiveSession] = useState(null)
  const [loading, setLoading] = useState(false)
  const [dbUrl, setDbUrl] = useState(null)
  const [dbSource, setDbSource] = useState(null)
  const [databaseLabel, setDatabaseLabel] = useState(null)
  const [datasetPreview, setDatasetPreview] = useState(null)
  const [exploration, setExploration] = useState(null)

  useEffect(() => { fetchSessions() }, [])

  const fetchSessions = async () => {
    try {
      const res = await getSessions()
      setSessions(res.data.sessions || [])
    } catch (e) { console.error(e) }
  }

  const handleConnected = ({ url, source, preview, exploration: exp, databaseLabel: label }) => {
    setDbUrl(url)
    setDbSource(source)
    setDatasetPreview(preview)
    setExploration(exp)
    setDatabaseLabel(label || 'Database')
    setActiveSession(null)
  }

  const handleAnalysis = async (result, query) => {
    try {
      const saved = await saveSession({
        query,
        summary: result.summary,
        kpi_cards: result.kpi_cards,
        dashboard_tabs: result.tabs,
        sql_used: result.sql_used,
        dataset_preview: datasetPreview,
        db_source: dbSource,
        schema_summary: exploration?.business_description || null,
        database_label: databaseLabel,
        table_overview: result.table_overview || null,
      })
      const newSession = {
        ...saved.data.session,
        kpi_cards: result.kpi_cards,
        dashboard_tabs: result.tabs,
        sql_used: result.sql_used,
        table_overview: result.table_overview,
      }
      setActiveSession(newSession)
      fetchSessions()
    } catch {
      setActiveSession({
        query,
        summary: result.summary,
        kpi_cards: result.kpi_cards,
        dashboard_tabs: result.tabs,
        sql_used: result.sql_used,
        table_overview: result.table_overview,
      })
    }
  }

  const handleSelectSession = async (session) => {
    try {
      const res = await getSession(session.id)
      setActiveSession(res.data.session)
    } catch (e) { console.error(e) }
  }

  const handleNewAnalysis = () => setActiveSession(null)
  const handleDisconnect = () => {
    setDbUrl(null); setDbSource(null); setDatasetPreview(null)
    setExploration(null); setDatabaseLabel(null); setActiveSession(null)
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0d1117' }}>
      <Sidebar
        sessions={sessions}
        activeSession={activeSession}
        onSelect={handleSelectSession}
        onNew={handleNewAnalysis}
        onRefresh={fetchSessions}
        connected={!!dbUrl}
        dbSource={dbSource}
        databaseLabel={databaseLabel}
        onDisconnect={handleDisconnect}
      />
      <main style={{ flex: 1, overflowY: 'auto', minWidth: 0 }}>
        {!dbUrl ? (
          <ConnectionScreen onConnected={handleConnected} />
        ) : !activeSession ? (
          <InputPanel
            onResult={handleAnalysis}
            loading={loading}
            setLoading={setLoading}
            exploration={exploration}
            dbSource={dbSource}
            dbUrl={dbUrl}
            databaseLabel={databaseLabel}
          />
        ) : (
          <DashboardView
            session={activeSession}
            onNew={handleNewAnalysis}
            dbUrl={dbUrl}
          />
        )}
      </main>
    </div>
  )
}