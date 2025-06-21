import { useState, useEffect, useRef } from 'react';

function ContextualFAB({ onScenarioSelect, user, activeScenario, onScenarioComplete }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showContextPanel, setShowContextPanel] = useState(false);
  const [activePanel, setActivePanel] = useState(null);
  const [panelPosition, setPanelPosition] = useState({ bottom: 80, right: 16 });
  const fabRef = useRef(null);

  const intentActions = [
    {
      id: 'emergency',
      icon: '🚀',
      label: "I'm Late!",
      description: 'Find fastest transport',
      color: '#ff4757',
      scenario: 'emergency_transport'
    },
    {
      id: 'share',
      icon: '🤝',
      label: 'Share Ride',
      description: 'Offer or find rides',
      color: '#2ed573',
      scenario: 'share_ride'
    },
    {
      id: 'spot',
      icon: '📍',
      label: 'Spot Transport',
      description: 'Report for rewards',
      color: '#3742fa',
      scenario: 'spot_transport'
    },
    {
      id: 'explore',
      icon: '🔍',
      label: 'Explore',
      description: 'See all options',
      color: '#ffa726',
      scenario: 'explore_options'
    },
    {
      id: 'community',
      icon: '💬',
      label: 'Ask Community',
      description: 'Get local advice',
      color: '#5f27cd',
      scenario: 'community_help'
    }
  ];

  // Calculate panel position based on FAB position and screen size
  useEffect(() => {
    if (fabRef.current && showContextPanel) {
      const fabRect = fabRef.current.getBoundingClientRect();
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      
      // Panel dimensions (approximately)
      const panelWidth = 350;
      const panelHeight = 400;
      
      let newPosition = {
        bottom: screenHeight - fabRect.top + 10, // 10px above FAB
        right: 16
      };
      
      // Adjust if panel would go off-screen
      if (fabRect.left < panelWidth + 20) {
        // Not enough space to the left, position to the right of FAB
        newPosition.right = screenWidth - fabRect.right - panelWidth - 10;
      } else {
        // Position to the left of FAB
        newPosition.right = screenWidth - fabRect.left + 10;
      }
      
      // Ensure panel doesn't go off top of screen
      if (newPosition.bottom + panelHeight > screenHeight - 20) {
        newPosition.bottom = Math.max(20, screenHeight - panelHeight - 20);
      }
      
      setPanelPosition(newPosition);
    }
  }, [showContextPanel, activePanel]);

  // ESC key support
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        if (showContextPanel) {
          handleClosePanel();
        } else if (isExpanded) {
          setIsExpanded(false);
        }
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [showContextPanel, isExpanded]);

  const handleActionClick = (action) => {
    setActivePanel(action);
    setShowContextPanel(true);
    setIsExpanded(false);
    // Don't call onScenarioSelect yet - let user interact in panel first
  };

  const handleClosePanel = () => {
    setShowContextPanel(false);
    setActivePanel(null);
    if (onScenarioComplete) {
      onScenarioComplete();
    }
  };

  const handlePanelAction = (actionType, data) => {
    // This is where panel-specific actions are handled
    if (actionType === 'proceed') {
      // Close panel first, then trigger scenario
      handleClosePanel();
      // Use setTimeout to ensure panel closes before modal opens
      setTimeout(() => {
        onScenarioSelect(activePanel.scenario);
      }, 100);
    }
  };

  const toggleExpanded = () => {
    if (showContextPanel) {
      handleClosePanel();
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <>
      {/* Main FAB Container */}
      <div className="contextual-fab-container">
        {/* Action Buttons */}
        <div 
          className={`fab-action-buttons ${isExpanded ? 'visible' : ''}`}
          style={{
            zIndex: 10001,
            pointerEvents: 'auto'
          }}
        >
          {intentActions.map((action, index) => (
            <button
              key={action.id}
              onClick={() => handleActionClick(action)}
              style={{
                '--action-color': action.color,
                '--animation-delay': `${index * 0.1}s`,
                position: 'relative',
                zIndex: 10000,
                pointerEvents: 'auto'
              }}
              className="fab-action-btn"
              title={action.description}
            >
              <span className="action-icon">{action.icon}</span>
              <span className="action-label">{action.label}</span>
            </button>
          ))}
        </div>

        {/* Main FAB */}
        <button 
          ref={fabRef}
          className={`main-fab ${isExpanded ? 'expanded' : ''} ${showContextPanel ? 'panel-active' : ''}`}
          onClick={toggleExpanded}
          title={showContextPanel ? 'Close' : isExpanded ? 'Close menu' : 'Quick Actions'}
        >
          <span className="main-fab-icon">
            {showContextPanel ? '✕' : isExpanded ? '✕' : '⚡'}
          </span>
        </button>

        {/* Backdrop - Only for expanded actions, not for contextual panel */}
        {isExpanded && !showContextPanel && (
          <div 
            className="fab-backdrop"
            onClick={() => setIsExpanded(false)}
          />
        )}
      </div>

      {/* Contextual Panel */}
      {showContextPanel && activePanel && (
        <div 
          className="contextual-panel"
          style={{
            bottom: `${panelPosition.bottom}px`,
            right: `${panelPosition.right}px`
          }}
        >
          <ContextualPanelContent 
            action={activePanel}
            onClose={handleClosePanel}
            onAction={handlePanelAction}
            user={user}
          />
        </div>
      )}
    </>
  );
}

// Panel content component
function ContextualPanelContent({ action, onClose, onAction, user }) {
  const [step, setStep] = useState('overview');

  const handleProceed = () => {
    if (action.id === 'emergency') {
      // For emergency, proceed directly to modal
      onAction('proceed');
    } else if (action.id === 'spot') {
      // For spot transport, proceed directly to modal
      onAction('proceed');
    } else {
      // For others (coming soon), just show notification
      alert(`${action.label} feature coming soon! 🚧\n\nWe'll notify you when it's ready.`);
      onClose();
    }
  };

  const handleDestinationSelect = (destination) => {
    // Save destination and proceed to full modal
    onAction('proceed', { destination });
  };

  return (
    <div className="panel-content">
      {/* Panel Header */}
      <div className="panel-header">
        <div className="panel-title">
          <span className="panel-icon" style={{ color: action.color }}>
            {action.icon}
          </span>
          <div>
            <h3>{action.label}</h3>
            <p>{action.description}</p>
          </div>
        </div>
        <button className="panel-close-btn" onClick={onClose}>✕</button>
      </div>

      {/* Panel Body */}
      <div className="panel-body">
        {step === 'overview' && (
          <div className="panel-overview">
            {action.id === 'emergency' && (
              <>
                <div className="quick-stats">
                  <div className="stat">
                    <span className="stat-icon">⚡</span>
                    <span>Avg 12 min</span>
                  </div>
                  <div className="stat">
                    <span className="stat-icon">💰</span>
                    <span>From ₹60</span>
                  </div>
                  <div className="stat">
                    <span className="stat-icon">🎯</span>
                    <span>95% reliable</span>
                  </div>
                </div>
                <p>Get fastest transport options right now based on your location and time.</p>
              </>
            )}
            
            {action.id === 'share' && (
              <>
                <div className="feature-preview">
                  <div className="preview-icon">🚗</div>
                  <p>Share rides and split costs with fellow travelers</p>
                </div>
                <div className="coming-soon-badge">Coming Soon</div>
              </>
            )}

            {action.id === 'spot' && (
              <>
                <div className="quick-stats">
                  <div className="stat">
                    <span className="stat-icon">📸</span>
                    <span>Photo verify</span>
                  </div>
                  <div className="stat">
                    <span className="stat-icon">🎯</span>
                    <span>+5-15 credits</span>
                  </div>
                  <div className="stat">
                    <span className="stat-icon">🏆</span>
                    <span>Leaderboard</span>
                  </div>
                </div>
                <p>Report bus locations and earn community rewards</p>
              </>
            )}

            {action.id === 'explore' && (
              <>
                <div className="feature-preview">
                  <div className="preview-icon">🗺️</div>
                  <p>Discover all transport options around you</p>
                </div>
                <div className="coming-soon-badge">Coming Soon</div>
              </>
            )}

            {action.id === 'community' && (
              <>
                <div className="feature-preview">
                  <div className="preview-icon">💬</div>
                  <p>Get local advice from experienced travelers</p>
                </div>
                <div className="coming-soon-badge">Coming Soon</div>
              </>
            )}

            <div className="panel-actions">
              <button 
                className="proceed-btn"
                style={{ background: action.color }}
                onClick={handleProceed}
                disabled={!['emergency', 'spot'].includes(action.id)}
              >
                {action.id === 'emergency' && 'Find Transport'}
                {action.id === 'spot' && 'Report Location'}
                {!['emergency', 'spot'].includes(action.id) && 'Get Notified'}
              </button>
            </div>
          </div>
        )}

        {step === 'destination' && action.id === 'emergency' && (
          <QuickDestinationPicker onSelect={handleDestinationSelect} />
        )}
      </div>
    </div>
  );
}

// Quick destination picker for emergency transport
function QuickDestinationPicker({ onSelect }) {
  const quickDestinations = [
    { name: 'Office', icon: '🏢', context: 'Work' },
    { name: 'Home', icon: '🏠', context: 'Personal' },
    { name: 'Airport', icon: '✈️', context: 'Travel' },
    { name: 'Hospital', icon: '🏥', context: 'Emergency' }
  ];

  return (
    <div className="quick-destinations">
      <h4>Where are you rushing to?</h4>
      <div className="destination-grid">
        {quickDestinations.map((dest, index) => (
          <button
            key={index}
            className="quick-dest-btn"
            onClick={() => onSelect(dest)}
          >
            <span className="dest-icon">{dest.icon}</span>
            <span className="dest-name">{dest.name}</span>
            <span className="dest-context">{dest.context}</span>
          </button>
        ))}
      </div>
      <button 
        className="custom-dest-btn"
        onClick={() => onSelect({ name: 'custom', custom: true })}
      >
        📍 Enter custom destination
      </button>
    </div>
  );
}

export default ContextualFAB;