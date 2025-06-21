import { useEffect } from 'react';

function SpotTransportPanel({ userLocation, onClose, screenSize }) {
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
    <div className="spot-transport-panel">
      <div className="panel-header">
        <div className="panel-title">
          <span className="panel-icon">📍</span>
          <div>
            <h2>Spot Transport</h2>
            <p>Report for community rewards</p>
          </div>
        </div>
        <button className="panel-close" onClick={onClose}>✕</button>
      </div>

      <div className="panel-content">
        <div className="coming-soon-panel">
          <div className="coming-soon-icon">🚧</div>
          <h3>Coming Soon!</h3>
          <p>Transport spotting rewards system is under development</p>
          
          <div className="feature-preview-compact">
            <h4>What you'll be able to do:</h4>
            <ul>
              <li>📸 Photo verify bus locations</li>
              <li>🎯 Earn points for accurate reports</li>
              <li>🏆 Compete on leaderboards</li>
              <li>💎 Redeem rewards for rides</li>
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

export default SpotTransportPanel;