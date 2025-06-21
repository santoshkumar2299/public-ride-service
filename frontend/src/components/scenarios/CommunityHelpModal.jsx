import { useState, useEffect } from 'react';

function CommunityHelpModal({ onClose, userLocation }) {
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
          <div className="modal-icon">💬</div>
          <h2>Ask Community</h2>
          <p>Get local transport advice from fellow travelers</p>
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
            <p>Community help feature is under development</p>
            
            <div className="feature-preview">
              <h4>What you'll be able to do:</h4>
              <ul>
                <li>❓ Ask locals about routes</li>
                <li>💡 Get real-time travel tips</li>
                <li>🗺️ Share route knowledge</li>
                <li>⭐ Help fellow travelers</li>
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

export default CommunityHelpModal;