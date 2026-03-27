import { useState, useEffect } from 'react'
import InputScreen from './components/InputScreen'
import ConfirmScreen from './components/ConfirmScreen'
import PreviewScreen from './components/PreviewScreen'
import DashboardScreen from './components/DashboardScreen'
import { exploreData } from './api'

export default function App() {
  const [screen, setScreen] = useState('input')
  const [exploration, setExploration] = useState(null)
  const [intent, setIntent] = useState(null)
  const [dashboards, setDashboards] = useState([])
  const [selectedDashboard, setSelectedDashboard] = useState(null)

  useEffect(() => {
    exploreData()
      .then(res => setExploration(res.data.exploration))
      .catch(err => console.error('Explore failed:', err))
  }, [])

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white">
      {screen === 'input' && (
        <InputScreen
          exploration={exploration}
          onIntent={(parsedIntent) => {
            setIntent(parsedIntent)
            setScreen('confirm')
          }}
        />
      )}
      {screen === 'confirm' && (
        <ConfirmScreen
          intent={intent}
          onConfirm={(dashboardList) => {
            setDashboards(dashboardList)
            setScreen('preview')
          }}
          onEdit={() => setScreen('input')}
        />
      )}
      {screen === 'preview' && (
        <PreviewScreen
          dashboards={dashboards}
          onSelect={(dashboard) => {
            setSelectedDashboard(dashboard)
            setScreen('dashboard')
          }}
        />
      )}
      {screen === 'dashboard' && (
        <DashboardScreen
          dashboard={selectedDashboard}
          onBack={() => setScreen('preview')}
        />
      )}
    </div>
  )
}