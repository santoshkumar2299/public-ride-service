import { useState, useEffect } from 'react';

function ShareRideModal({ onClose, userLocation }) {
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
          <div className="modal-icon">🤝</div>
          <h2>Share Ride</h2>
          <p>Offer seats or find shared rides</p>
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
            <p>Share rides feature is under development</p>
            
            <div className="feature-preview">
              <h4>What you'll be able to do:</h4>
              <ul>
                <li>🚗 Offer empty seats in your car</li>
                <li>🔍 Find rides going your way</li>
                <li>💰 Split costs fairly</li>
                <li>⭐ Rate your co-passengers</li>
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

export default ShareRideModal;