import './NavigationBar.css'
import uosmLogo from '../assets/UOSMLogo.jpg'

const pages = [
  { id: 'dashboard', label: 'Dashboard', icon: '▦' },
  { id: 'runs', label: 'Runs', icon: '↻' },
  { id: 'analysis', label: 'Analysis', icon: '◫' },
]

function NavigationBar({ activePage }) {
  return (
    <aside className="sidebar" aria-label="Primary navigation">
      <div className="brand">
        <img className="brand-mark" src={uosmLogo} alt="" />

        <div>
          <strong>Telemetry</strong>
          <span>Dashboard</span>
        </div>
      </div>

      <nav className="navigation">
        <span className="navigation-label">Workspace</span>

        {pages.map((page) => (
          <a
            key={page.id}
            className={
              activePage === page.id
                ? 'navigation-link active'
                : 'navigation-link'
            }
            href={`#${page.id}`}
            aria-current={activePage === page.id ? 'page' : undefined}
          >
            <span className="navigation-icon" aria-hidden="true">
              {page.icon}
            </span>

            {page.label}
          </a>
        ))}
      </nav>

      <div className="sidebar-footer">
        <span className="status-dot" aria-hidden="true" />
        System online
      </div>
    </aside>
  )
}

export default NavigationBar
