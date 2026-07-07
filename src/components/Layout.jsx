// Layout is now only used by AdminPage.
// All other pages handle their own full-bleed layout.
import { Link, useLocation } from 'react-router-dom'

function Layout({ children }) {
  const location = useLocation()

  return (
    <div className="white-screen">
      <div className="white-header">
        <Link to="/" style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.1rem', fontStyle: 'italic', color: '#6B73E8', textDecoration: 'none' }}>
          Lore
        </Link>
        <span style={{ fontSize: '0.72rem', color: '#9999AA', fontWeight: 500 }}>Ko Twenty Ate</span>
      </div>

      <div className="white-content has-bottom-nav" style={{ paddingTop: 20 }}>
        {children}
      </div>

      <nav className="bottom-nav">
        {[
          { path: '/mission', label: 'Mission', icon: '✦' },
          { path: '/board',   label: 'Evidence', icon: '⊞' },
          { path: '/submit',  label: 'Submit',  icon: '↑' },
        ].map(item => (
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
    </div>
  )
}

export default Layout
