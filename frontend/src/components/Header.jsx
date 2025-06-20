import { useState, useEffect, useRef } from 'react'
import { CarIcon, ArrowLeftIcon, UserIcon, SettingsIcon, LogoutIcon, ProfileIcon, HistoryIcon, ActiveIcon, HomeIcon } from './Icons'
import useDeviceDetection from '../hooks/useDeviceDetection'

function Header({ 
  user, 
  currentView, 
  userRole, 
  journeyData, 
  onNavigate, 
  onGoBack, 
  onLogout 
}) {
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const userMenuRef = useRef(null)
  
  // Device detection
  const deviceInfo = useDeviceDetection()
  
  // Log device info for debugging
  useEffect(() => {
    console.log('Device Detection:', deviceInfo)
  }, [deviceInfo])

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

  // Get current page title
  const getPageTitle = () => {
    if (userRole === 'passenger') return 'Request Ride'
    if (userRole === 'rider') return 'Offer Ride'
    
    switch (currentView) {
      case 'ride-history': return 'Ride History'
      case 'active-rides': return 'Active Rides'
      case 'profile': return 'Profile'
      case 'journey-complete': return 'Journey Complete'
      default: return 'Ride Share'
    }
  }

  const showBackButton = userRole || currentView === 'journey-complete'

  const navigationItems = [
    { id: 'home', label: 'Home', icon: HomeIcon },
    { id: 'active-rides', label: 'Active Rides', icon: ActiveIcon },
    { id: 'ride-history', label: 'History', icon: HistoryIcon },
    { id: 'profile', label: 'Profile', icon: ProfileIcon }
  ]

  // Render different layouts based on device type
  if (deviceInfo.isMobile) {
    return (
      <header className="mobile-header">
        <div className="header-container mobile">
          {/* Mobile: Back button on left */}
          {showBackButton && (
            <button onClick={onGoBack} className="mobile-back-btn">
              <ArrowLeftIcon size={20} />
            </button>
          )}
          
          {/* Mobile: App name in center */}
          <div className="mobile-brand" onClick={() => onNavigate('home')}>
            <CarIcon size={20} color="#e91e63" />
            <span className="mobile-app-name">RideShare</span>
          </div>

          {/* Mobile: User avatar on right */}
          <div className="user-menu mobile" ref={userMenuRef}>
            <button 
              className="mobile-user-btn"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <div className="user-avatar mobile">
                {user.username?.charAt(0).toUpperCase() || 'U'}
              </div>
            </button>

            {showUserMenu && (
              <div className="mobile-user-dropdown">
                <div className="dropdown-header mobile">
                  <div className="user-avatar large">
                    {user.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <div className="dropdown-username">{user.username}</div>
                    <div className="dropdown-email">user@rideshare.com</div>
                    <div className="device-info">📱 Mobile • {deviceInfo.os}</div>
                  </div>
                </div>
                
                <div className="dropdown-divider"></div>
                
                <div className="dropdown-items mobile">
                  <button
                    className="dropdown-item mobile"
                    onClick={() => {
                      onNavigate('home')
                      setShowUserMenu(false)
                    }}
                  >
                    <HomeIcon size={18} />
                    <span>Home</span>
                  </button>

                  <button
                    className="dropdown-item mobile"
                    onClick={() => {
                      onNavigate('active-rides')
                      setShowUserMenu(false)
                    }}
                  >
                    <ActiveIcon size={18} />
                    <span>Active Rides</span>
                  </button>
                  
                  <button
                    className="dropdown-item mobile"
                    onClick={() => {
                      onNavigate('ride-history')
                      setShowUserMenu(false)
                    }}
                  >
                    <HistoryIcon size={18} />
                    <span>Ride History</span>
                  </button>
                  
                  <button
                    className="dropdown-item mobile"
                    onClick={() => {
                      onNavigate('profile')
                      setShowUserMenu(false)
                    }}
                  >
                    <ProfileIcon size={18} />
                    <span>Profile</span>
                  </button>
                  
                  <button className="dropdown-item mobile" disabled>
                    <SettingsIcon size={18} />
                    <span>Settings</span>
                    <span className="badge">Soon</span>
                  </button>
                </div>
                
                <div className="dropdown-divider"></div>
                
                <button
                  className="dropdown-item logout mobile"
                  onClick={() => {
                    onLogout()
                    setShowUserMenu(false)
                  }}
                >
                  <LogoutIcon size={18} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
    )
  }

  // Desktop/Tablet Layout
  return (
    <header className="desktop-header">
      <div className="header-container desktop">
        {/* Desktop: App Name/Brand on left */}
        <div className="app-brand desktop" onClick={() => onNavigate('home')}>
          <CarIcon size={28} color="#e91e63" />
          <span className="app-name desktop">RideShare</span>
          <span className="app-tagline">Connect & Go</span>
        </div>

        {/* Desktop: Actions on right */}
        <div className="desktop-actions">
          {/* Back Button (when needed) */}
          {showBackButton && (
            <button onClick={onGoBack} className="desktop-back-btn">
              <ArrowLeftIcon size={18} />
              <span>Back</span>
            </button>
          )}

          {/* User Menu */}
          <div className="user-menu desktop" ref={userMenuRef}>
            <button 
              className="desktop-user-btn"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <div className="user-avatar desktop">
                {user.username?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="user-details">
                <span className="username">{user.username}</span>
                <span className="status">🖥️ {deviceInfo.os}</span>
              </div>
            </button>

            {showUserMenu && (
              <div className="desktop-user-dropdown">
                <div className="dropdown-header desktop">
                  <div className="user-avatar large">
                    {user.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <div className="dropdown-username">{user.username}</div>
                    <div className="dropdown-email">user@rideshare.com</div>
                    <div className="device-info">🖥️ Desktop • {deviceInfo.browser} • {deviceInfo.os}</div>
                  </div>
                </div>
                
                <div className="dropdown-divider"></div>
                
                <div className="dropdown-items desktop">
                  <button
                    className="dropdown-item desktop"
                    onClick={() => {
                      onNavigate('home')
                      setShowUserMenu(false)
                    }}
                  >
                    <HomeIcon size={16} />
                    <span>Home</span>
                  </button>

                  <button
                    className="dropdown-item desktop"
                    onClick={() => {
                      onNavigate('active-rides')
                      setShowUserMenu(false)
                    }}
                  >
                    <ActiveIcon size={16} />
                    <span>Active Rides</span>
                  </button>
                  
                  <button
                    className="dropdown-item desktop"
                    onClick={() => {
                      onNavigate('ride-history')
                      setShowUserMenu(false)
                    }}
                  >
                    <HistoryIcon size={16} />
                    <span>Ride History</span>
                  </button>
                  
                  <button
                    className="dropdown-item desktop"
                    onClick={() => {
                      onNavigate('profile')
                      setShowUserMenu(false)
                    }}
                  >
                    <ProfileIcon size={16} />
                    <span>Profile Settings</span>
                  </button>
                  
                  <button className="dropdown-item desktop" disabled>
                    <SettingsIcon size={16} />
                    <span>Preferences</span>
                    <span className="badge">Soon</span>
                  </button>
                </div>
                
                <div className="dropdown-divider"></div>
                
                <button
                  className="dropdown-item logout desktop"
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
      </div>
    </header>
  )
}

export default Header