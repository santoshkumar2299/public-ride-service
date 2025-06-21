import { useState, useEffect, useRef } from 'react'
import { CarIcon, LogoutIcon, ProfileIcon, HistoryIcon, ActiveIcon, HomeIcon } from './Icons'

function Header({ 
  user, 
  currentView, 
  userRole, 
  onNavigate, 
  onLogout
}) {
  const [showUserMenu, setShowUserMenu] = useState(false)
  const userMenuRef = useRef(null)

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Simplified header - just logo on left and user button on right
  return (
    <header className="simplified-header">
      <div className="header-container">
        {/* Logo on left */}
        <div className="app-brand" onClick={() => onNavigate('home')}>
          <CarIcon size={24} />
          <span className="app-name">Transit Tracker</span>
        </div>

        {/* User menu on right */}
        <div className="user-menu" ref={userMenuRef}>
          <button 
            className="user-btn"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div className="user-avatar">
              {user.username?.charAt(0).toUpperCase() || 'U'}
            </div>
          </button>

          {showUserMenu && (
            <div className="user-dropdown">
              <div className="dropdown-header">
                <div className="user-avatar large">
                  {user.username?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <div className="dropdown-username">{user.username}</div>
                  <div className="dropdown-email">user@rideshare.com</div>
                </div>
              </div>
              
              <div className="dropdown-divider"></div>
              
              <div className="dropdown-items">
                <button
                  className="dropdown-item"
                  onClick={() => {
                    onNavigate('home')
                    setShowUserMenu(false)
                  }}
                >
                  <HomeIcon size={16} />
                  <span>Home</span>
                </button>

                <button
                  className="dropdown-item"
                  onClick={() => {
                    onNavigate('active-rides')
                    setShowUserMenu(false)
                  }}
                >
                  <ActiveIcon size={16} />
                  <span>Active Rides</span>
                </button>
                
                <button
                  className="dropdown-item"
                  onClick={() => {
                    onNavigate('ride-history')
                    setShowUserMenu(false)
                  }}
                >
                  <HistoryIcon size={16} />
                  <span>History</span>
                </button>
                
                <button
                  className="dropdown-item"
                  onClick={() => {
                    onNavigate('profile')
                    setShowUserMenu(false)
                  }}
                >
                  <ProfileIcon size={16} />
                  <span>Profile</span>
                </button>
              </div>
              
              <div className="dropdown-divider"></div>
              
              <button
                className="dropdown-item logout"
                onClick={() => {
                  onLogout()
                  setShowUserMenu(false)
                }}
              >
                <LogoutIcon size={16} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header