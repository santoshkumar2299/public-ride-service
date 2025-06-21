import { useEffect } from 'react';

function ExploreOptionsPanel({ userLocation, onClose, screenSize }) {
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
    <div className="explore-options-panel">
      <div className="panel-header">
        <div className="panel-title">
          <span className="panel-icon">🔍</span>
          <div>
            <h2>Explore Options</h2>
            <p>Discover all transport modes</p>
          </div>
        </div>
        <button className="panel-close" onClick={onClose}>✕</button>
      </div>

      <div className="panel-content">
        <div className="coming-soon-panel">
          <div className="coming-soon-icon">🚧</div>
          <h3>Coming Soon!</h3>
          <p>Multi-modal transport explorer is under development</p>
          
          <div className="feature-preview-compact">
            <h4>What you'll be able to do:</h4>
            <ul>
              <li>🚌 See all nearby buses & timings</li>
              <li>🚗 Compare ride options & prices</li>
              <li>🛺 Find auto-rickshaws instantly</li>
              <li>🚇 Check metro schedules</li>
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

export default ExploreOptionsPanel;