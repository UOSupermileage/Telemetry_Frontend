import { useEffect, useState } from 'react'
import './App.css'

import NavigationBar from './components/NavigationBar'
import DashboardPage from './pages/DashboardPage'
import RunsPage from './pages/RunsPage'

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

function App() {
  const [activePage, setActivePage] = useState(getPageFromHash)

  const content = pageContent[activePage]

  useEffect(() => {
    const handleHashChange = () => {
      setActivePage(getPageFromHash())
    }

    window.addEventListener('hashchange', handleHashChange)

    return () => {
      window.removeEventListener('hashchange', handleHashChange)
    }
  }, [])

  return (
    <div className="app-shell">

      {/* Main navigation sidebar */}
      <NavigationBar activePage={activePage} />

      <main className="main-content">

        <header className="topbar">
          <span className="breadcrumb">
            Workspace / {content.title}
          </span>

          <div className="user-avatar" aria-label="User profile">
            CR
          </div>
        </header>

        <section className="page-content">

          <p className="eyebrow">{content.eyebrow}</p>

          <h1>{content.title}</h1>

          <p className="page-description">
            {content.description}
          </p>

          {activePage === 'dashboard' ? <DashboardPage /> : activePage === 'runs' ? <RunsPage /> : (

            <div className="content-placeholder">

              <span className="placeholder-icon" aria-hidden="true">
                {pages.find(({ id }) => id === activePage).icon}
              </span>

              <h2>{content.title} content</h2>

              <p>
                This area is ready for your{' '}
                {content.title.toLowerCase()} data and visualizations.
              </p>

            </div>
          )}

        </section>
      </main>
    </div>
  )
}

export default App
