import { useState, useEffect } from 'react';

function ExploreOptionsModal({ onClose, userLocation }) {
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
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <div className="modal-icon">🔍</div>
          <h2>Explore Options</h2>
          <p>Discover all transport modes around you</p>
          <div className="header-actions">
            <button className="home-btn" onClick={onClose} title="Back to map">
              🏠 Home
            </button>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        <div className="modal-content">
          <div className="coming-soon">
            <div className="coming-soon-icon">🚧</div>
            <h3>Coming Soon!</h3>
            <p>Multi-modal transport explorer is under development</p>
            
            <div className="feature-preview">
              <h4>What you'll be able to do:</h4>
              <ul>
                <li>🚌 See all nearby buses & timings</li>
                <li>🚗 Compare ride options & prices</li>
                <li>🛺 Find auto-rickshaws instantly</li>
                <li>🚇 Check metro schedules</li>
              </ul>
            </div>
            
            <button className="notify-btn">
              🔔 Notify me when ready
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExploreOptionsModal;