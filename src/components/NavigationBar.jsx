import './NavigationBar.css'
import uosmLogo from '../assets/UOSMLogo.jpg'
import { navigationPages } from '../data/mockData'

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

        {navigationPages.map((page) => (
          <a
            key={page.id}
            className={
              activePage === page.id
                ? 'navigation-link active'
                : 'navigation-link'
            }
            href={`#${page.id}`}
            title={page.label}
            aria-current={activePage === page.id ? 'page' : undefined}
          >
            <span className="navigation-icon" aria-hidden="true">
              {page.icon}
            </span>

            <span className="navigation-text">{page.label}</span>
          </a>
        ))}
      </nav>

      <div className="sidebar-footer">
        <span className="status-dot" aria-hidden="true" />
        Demo mode
      </div>
    </aside>
  )
}

export default NavigationBar
