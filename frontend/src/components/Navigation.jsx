import { useState } from 'react';

function Navigation({ user, onNavigate, currentView }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuItems = [
    { id: 'home', label: '🏠 Home', icon: '🏠' },
    { id: 'ride-history', label: '📚 Ride History', icon: '📚' },
    { id: 'active-rides', label: '🚗 Active Rides', icon: '🚗' },
    { id: 'profile', label: '👤 Profile', icon: '👤' }
  ];

  const handleMenuClick = (itemId) => {
    onNavigate(itemId);
    setIsMenuOpen(false);
  };

  return (
    <div className="navigation">
      {/* Mobile menu button */}
      <button 
        className="menu-toggle"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        aria-label="Toggle menu"
      >
        <span className="hamburger">
          <span></span>
          <span></span>
          <span></span>
        </span>
      </button>

      {/* Desktop navigation */}
      <nav className="nav-desktop">
        {menuItems.map(item => (
          <button
            key={item.id}
            className={`nav-item ${currentView === item.id ? 'active' : ''}`}
            onClick={() => handleMenuClick(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Mobile navigation overlay */}
      {isMenuOpen && (
        <>
          <div 
            className="nav-overlay" 
            onClick={() => setIsMenuOpen(false)}
          ></div>
          <nav className="nav-mobile">
            <div className="nav-mobile-header">
              <h3>Menu</h3>
              <button 
                className="nav-close"
                onClick={() => setIsMenuOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="nav-mobile-content">
              {menuItems.map(item => (
                <button
                  key={item.id}
                  className={`nav-mobile-item ${currentView === item.id ? 'active' : ''}`}
                  onClick={() => handleMenuClick(item.id)}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                </button>
              ))}
            </div>
          </nav>
        </>
      )}
    </div>
  );
}

export default Navigation;