import { useEffect } from 'react';

function CommunityHelpPanel({ userLocation, onClose, screenSize }) {
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
    <div className="community-help-panel">
      <div className="panel-header">
        <div className="panel-title">
          <span className="panel-icon">💬</span>
          <div>
            <h2>Ask Community</h2>
            <p>Get local transport advice</p>
          </div>
        </div>
        <button className="panel-close" onClick={onClose}>✕</button>
      </div>

      <div className="panel-content">
        <div className="coming-soon-panel">
          <div className="coming-soon-icon">🚧</div>
          <h3>Coming Soon!</h3>
          <p>Community help feature is under development</p>
          
          <div className="feature-preview-compact">
            <h4>What you'll be able to do:</h4>
            <ul>
              <li>❓ Ask locals about routes</li>
              <li>💡 Get real-time travel tips</li>
              <li>🗺️ Share route knowledge</li>
              <li>⭐ Help fellow travelers</li>
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

export default CommunityHelpPanel;