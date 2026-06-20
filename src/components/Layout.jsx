import { Link, useLocation } from 'react-router-dom'

function Layout({ children, showNav = true, hideHeader = false }) {
  const location = useLocation()

  const navItems = [
    { path: '/mission', label: 'Mission', icon: '🎯' },
    { path: '/board', label: 'Evidence', icon: '📸' },
    { path: '/submit', label: 'Submit', icon: '⬆️' },
  ]

  return (
    <div className="layout">
      {!hideHeader && (
        <header className="layout-header">
          <Link to="/" className="layout-logo">Lore</Link>
          <span className="layout-event-name">Mission: ATE</span>
        </header>
      )}

      <main className={`layout-content ${showNav ? 'has-bottom-nav' : ''}`} style={{ paddingTop: 24 }}>
        {children}
      </main>

      {showNav && (
        <nav className="bottom-nav">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={location.pathname === item.path ? 'active' : ''}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </div>
  )
}

export default Layout
