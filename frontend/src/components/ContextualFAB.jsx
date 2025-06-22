import { useState, useEffect, useRef } from 'react';
import FloatingCard from './inline-tools/FloatingCard';
import EmergencyFloatingCard from './inline-tools/EmergencyFloatingCard';

function ContextualFAB({ onScenarioSelect, user, activeScenario, onScenarioComplete, userLocation, currentView, onNavigate, onNotification }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showContextPanel, setShowContextPanel] = useState(false);
  const [activePanel, setActivePanel] = useState(null);
  const [panelPosition, setPanelPosition] = useState({ bottom: 80, right: 16 });
  const [showFloatingCard, setShowFloatingCard] = useState(false);
  const [showEmergencyCard, setShowEmergencyCard] = useState(false);
  const fabRef = useRef(null);

  // Content preservation functions
  const checkForUnsavedContent = () => {
    try {
      // Check for any form inputs with content
      const inputs = document.querySelectorAll('input[type="text"], input[type="email"], textarea, select');
      const hasContent = Array.from(inputs).some(input => {
        return input.value && input.value.trim().length > 0;
      });

      // Check for any unsaved draft states (common in forms)
      const hasDrafts = localStorage.getItem('draft_data') !== null;
      
      return hasContent || hasDrafts;
    } catch (error) {
      console.warn('Error checking for unsaved content:', error);
      return false;
    }
  };

  const preserveUserContent = () => {
    try {
      // Auto-save all form content to localStorage
      const contentBackup = {
        timestamp: new Date().toISOString(),
        url: window.location.href,
        forms: {}
      };

      // Capture all form data
      const inputs = document.querySelectorAll('input[type="text"], input[type="email"], textarea, select');
      Array.from(inputs).forEach((input, index) => {
        if (input.value && input.value.trim().length > 0) {
          contentBackup.forms[`field_${index}_${input.name || input.id || 'unnamed'}`] = {
            type: input.type || input.tagName.toLowerCase(),
            value: input.value,
            placeholder: input.placeholder || '',
            label: input.getAttribute('aria-label') || ''
          };
        }
      });

      // Only save if there's actual content
      if (Object.keys(contentBackup.forms).length > 0) {
        localStorage.setItem('fab_navigation_backup', JSON.stringify(contentBackup));
        console.log('💾 User content preserved:', Object.keys(contentBackup.forms).length, 'fields');
        return true;
      }
      return false;
    } catch (error) {
      console.warn('Error preserving content:', error);
      return false;
    }
  };

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
        if (showEmergencyCard) {
          setShowEmergencyCard(false);
        } else if (showFloatingCard) {
          setShowFloatingCard(false);
        } else if (showContextPanel) {
          handleClosePanel();
        } else if (isExpanded) {
          setIsExpanded(false);
        }
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [showContextPanel, isExpanded, showFloatingCard, showEmergencyCard]);

  const handleActionClick = (action) => {
    console.log('🎯 Action clicked:', action.id, action.label);
    
    // Direct actions with navigation handling
    if (action.id === 'spot') {
      // Spot Transport - handle navigation and FloatingCard
      setIsExpanded(false);
      
      // If not on map view, navigate first
      if (currentView !== 'home') {
        console.log('📍 Navigating to map for spot transport...');
        
        // Check for unsaved content and preserve it
        const hasUnsavedContent = checkForUnsavedContent();
        if (hasUnsavedContent) {
          preserveUserContent();
          if (onNotification) {
            onNotification('💾 Content saved • Navigating to map for bus spotting...');
          }
        } else {
          if (onNotification) {
            onNotification('📍 Navigating to map for bus spotting...');
          }
        }
        
        onNavigate('home'); // Navigate to map
        
        // Open FloatingCard after navigation
        setTimeout(() => {
          setShowFloatingCard(true);
        }, 200);
      } else {
        // Already on map, open FloatingCard directly
        setShowFloatingCard(true);
      }
      return;
    }
    
    if (action.id === 'emergency') {
      // Emergency Transport - handle navigation and EmergencyFloatingCard
      setIsExpanded(false);
      
      // If not on map view, navigate first
      if (currentView !== 'home') {
        
        // Check for unsaved content and preserve it
        const hasUnsavedContent = checkForUnsavedContent();
        if (hasUnsavedContent) {
          preserveUserContent();
          if (onNotification) {
            onNotification('💾 Content saved • Navigating to map for emergency transport...');
          }
        } else {
          if (onNotification) {
            onNotification('🚨 Navigating to map for emergency transport...');
          }
        }
        
        onNavigate('home'); // Navigate to map
        
        // Open EmergencyFloatingCard after navigation
        setTimeout(() => {
          setShowEmergencyCard(true);
        }, 200);
      } else {
        // Already on map, open EmergencyFloatingCard directly
        setShowEmergencyCard(true);
      }
      return;
    }
    
    // Default behavior - open contextual panel for other actions
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
            zIndex: 15002,
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
                zIndex: 15003,
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

      {/* FloatingCard for Spot Transport */}
      {showFloatingCard && (
        <FloatingCard 
          userLocation={userLocation}
          onClose={() => setShowFloatingCard(false)}
        />
      )}

      {/* EmergencyFloatingCard for Emergency Transport */}
      {showEmergencyCard && (
        <EmergencyFloatingCard 
          userLocation={userLocation}
          onClose={() => setShowEmergencyCard(false)}
        />
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