import { useEffect, useState } from 'react'
import './App.css'

import NavigationBar from './components/NavigationBar'
import RunsTable from './components/RunsTable'

const pages = [
  { id: 'dashboard', label: 'Dashboard', icon: '▦' },
  { id: 'runs', label: 'Runs', icon: '↻' },
  { id: 'analysis', label: 'Analysis', icon: '◫' },
]

const pageContent = {
  dashboard: {
    eyebrow: 'Overview',
    title: 'Dashboard',
    description: 'Monitor your vehicle telemetry at a glance.',
  },
  runs: {
    eyebrow: 'Telemetry',
    title: 'Runs',
    description: 'Review recent vehicle runs and their performance.',
  },
  analysis: {
    eyebrow: 'Insights',
    title: 'Analysis',
    description: 'Compare telemetry data and identify trends.',
  },
}

function getPageFromHash() {
  const page = window.location.hash.slice(1)
  return pages.some(({ id }) => id === page) ? page : 'dashboard'
}

const testRuns = [
  {
    run_id: 1,
    car_id: 2,
    location_id: 1,
    driver_id: 3,
    started_at: '2026-09-20T14:00:00',
    ended_at: '2026-09-20T14:15:00',
    notes: 'First test run',
    date_created: '2026-09-20T15:00:00',
  },
  {
    run_id: 2,
    car_id: 1,
    location_id: 2,
    driver_id: 4,
    started_at: '2026-09-21T10:30:00',
    ended_at: '2026-09-21T10:48:00',
    notes: 'Testing new setup',
    date_created: '2026-09-21T11:00:00',
  },
  {
    run_id: 3,
    car_id: 2,
    location_id: 1,
    driver_id: 3,
    started_at: '2026-09-22T13:00:00',
    ended_at: '2026-09-22T13:22:00',
    notes: '',
    date_created: '2026-09-22T14:00:00',
  },
]

function App() {
  const [activePage, setActivePage] = useState(getPageFromHash)
  const content = pageContent[activePage]

  useEffect(() => {
    const handleHashChange = () => setActivePage(getPageFromHash())
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  return (
    <div className="app-shell">

      <main className="main-content">
        <header className="topbar">
          <span className="breadcrumb">Workspace / {content.title}</span>
          <div className="user-avatar" aria-label="User profile">CR</div>
        </header>

        <section className="page-content">
          <p className="eyebrow">{content.eyebrow}</p>
          <h1>{content.title}</h1>
          <p className="page-description">{content.description}</p>

          {activePage === 'runs' ? (
            <RunsTable
              runs={testRuns}
              onRunClick={(run) => {
                console.log('Selected run:', run)
              }}
            />
          ) : (
            <div className="content-placeholder">
              <span className="placeholder-icon" aria-hidden="true">
                {pages.find(({ id }) => id === activePage).icon}
              </span>

              <h2>{content.title} content</h2>

              <p>
              This area is ready for your {content.title.toLowerCase()} data and visualizations.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}



export default App
