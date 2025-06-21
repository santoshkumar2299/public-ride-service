import { useEffect } from 'react';

function ShareRidePanel({ userLocation, onClose, screenSize }) {
  // MANDATORY: ESC key support for human UX
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [onClose]);

  return (
    <div className="share-ride-panel">
      <div className="panel-header">
        <div className="panel-title">
          <span className="panel-icon">🤝</span>
          <div>
            <h2>Share Ride</h2>
            <p>Offer or find shared rides</p>
          </div>
        </div>
        <button className="panel-close" onClick={onClose}>✕</button>
      </div>

      <div className="panel-content">
        <div className="coming-soon-panel">
          <div className="coming-soon-icon">🚧</div>
          <h3>Coming Soon!</h3>
          <p>Share rides feature is under development</p>
          
          <div className="feature-preview-compact">
            <h4>What you'll be able to do:</h4>
            <ul>
              <li>🚗 Offer empty seats in your car</li>
              <li>🔍 Find rides going your way</li>
              <li>💰 Split costs fairly</li>
              <li>⭐ Rate your co-passengers</li>
            </ul>
          </div>
          
          <button className="notify-btn-compact">
            🔔 Notify me when ready
          </button>
        </div>
      </div>
    </div>
  );
}

export default ShareRidePanel;