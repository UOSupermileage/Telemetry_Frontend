import { useEffect, useRef, useState } from 'react'
import './App.css'

import NavigationBar from './components/NavigationBar'
import DashboardPage from './pages/DashboardPage'
import AnalysisPage from './pages/AnalysisPage'
import RunsPage from './pages/RunsPage'
import { mockRuns, navigationPages } from './data/mockData'

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
  const page = window.location.hash.slice(1).split('?')[0]
  return navigationPages.some(({ id }) => id === page) ? page : 'dashboard'
}

function getRunIdFromHash() {
  return new URLSearchParams(window.location.hash.split('?')[1] || '').get('run') || ''
}

function getCompareRunIdFromHash() {
  return new URLSearchParams(window.location.hash.split('?')[1] || '').get('compare') || ''
}

function App() {
  const [activePage, setActivePage] = useState(getPageFromHash)
  const [runs, setRuns] = useState(mockRuns)
  const [selectedRunId, setSelectedRunId] = useState(getRunIdFromHash)
  const [compareRunId, setCompareRunId] = useState(getCompareRunIdFromHash)
  const [profileOpen, setProfileOpen] = useState(false)
  const profileMenuRef = useRef(null)

  const openRunAnalysis = (run) => {
    setSelectedRunId(run.run_id)
    setCompareRunId('')
    setActivePage('analysis')
    window.location.hash = `analysis?run=${encodeURIComponent(run.run_id)}`
  }

  const openRunComparison = ([firstRunId, secondRunId]) => {
    setSelectedRunId(firstRunId)
    setCompareRunId(secondRunId)
    setActivePage('analysis')
    window.location.hash = `analysis?run=${encodeURIComponent(firstRunId)}&compare=${encodeURIComponent(secondRunId)}`
  }

  const deleteRun = (deletedRun) => {
    setRuns((current) => current.filter((run) => run.run_id !== deletedRun.run_id))
  }

  const content = pageContent[activePage]

  useEffect(() => {
    const handleHashChange = () => {
      setActivePage(getPageFromHash())
      setSelectedRunId(getRunIdFromHash())
      setCompareRunId(getCompareRunIdFromHash())
    }

    window.addEventListener('hashchange', handleHashChange)

    return () => {
      window.removeEventListener('hashchange', handleHashChange)
    }
  }, [])

  useEffect(() => {
    if (!profileOpen) return undefined

    const closeProfileMenu = (event) => {
      if (event.type === 'keydown' && event.key !== 'Escape') return
      if (event.type === 'pointerdown' && profileMenuRef.current?.contains(event.target)) return
      setProfileOpen(false)
    }

    document.addEventListener('pointerdown', closeProfileMenu)
    document.addEventListener('keydown', closeProfileMenu)
    return () => {
      document.removeEventListener('pointerdown', closeProfileMenu)
      document.removeEventListener('keydown', closeProfileMenu)
    }
  }, [profileOpen])

  return (
    <div className="app-shell">

      {/* Main navigation sidebar */}
      <NavigationBar activePage={activePage} />

      <main className="main-content">

        <header className="topbar">
          <span className="breadcrumb">
            Workspace / {content.title}
          </span>

          <div className="profile-menu-container" ref={profileMenuRef}>
            <button
              className="user-avatar"
              type="button"
              aria-label="Open profile menu"
              aria-haspopup="menu"
              aria-expanded={profileOpen}
              onClick={() => setProfileOpen((open) => !open)}
            >
              CR
            </button>
            {profileOpen && (
              <div className="profile-menu" role="menu" aria-label="Profile">
                <div className="profile-menu-heading">
                  <span className="profile-menu-avatar" aria-hidden="true">CR</span>
                  <span><strong>Current user</strong><small>Demo account</small></span>
                </div>
                <div className="profile-menu-divider" />
                <div className="profile-menu-item" role="menuitem" aria-disabled="true">Profile</div>
                <div className="profile-menu-item" role="menuitem" aria-disabled="true">Account settings</div>
              </div>
            )}
          </div>
        </header>

        <section className="page-content">

          <p className="eyebrow">{content.eyebrow}</p>

          <h1>{content.title}</h1>

          <p className="page-description">
            {content.description}
          </p>

          {activePage === 'dashboard' ? <DashboardPage /> : activePage === 'runs' ? <RunsPage onRunDelete={deleteRun} onRunSelect={openRunAnalysis} onRunCompare={openRunComparison} /> : activePage === 'analysis' ? <AnalysisPage runs={runs} selectedRunId={selectedRunId} requestedCompareRunId={compareRunId} /> : (

            <div className="content-placeholder">

              <span className="placeholder-icon" aria-hidden="true">
                {navigationPages.find(({ id }) => id === activePage).icon}
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
