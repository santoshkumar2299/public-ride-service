import { useState } from 'react';

function IntentActionButtons({ onScenarioSelect, user }) {
  const [isExpanded, setIsExpanded] = useState(false);

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
  ]; // Show all intent actions

  const handleActionClick = (action) => {
    console.log('Intent action clicked:', action);
    onScenarioSelect(action.scenario);
    setIsExpanded(false);
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="intent-action-buttons">
      {/* Main FAB */}
      <button 
        className={`main-fab ${isExpanded ? 'expanded' : ''}`}
        onClick={toggleExpanded}
        title={isExpanded ? 'Close' : 'Quick Actions'}
      >
        <span className="main-fab-icon">
          {isExpanded ? '✕' : '⚡'}
        </span>
      </button>

      {/* Action Buttons */}
      <div className={`action-buttons-container ${isExpanded ? 'visible' : ''}`}>
        {intentActions.map((action, index) => (
          <button
            key={action.id}
            className="intent-action-btn"
            onClick={() => handleActionClick(action)}
            style={{
              '--action-color': action.color,
              '--animation-delay': `${index * 0.1}s`
            }}
            title={action.description}
          >
            <span className="action-icon">{action.icon}</span>
            <span className="action-label">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Backdrop */}
      {isExpanded && (
        <div 
          className="fab-backdrop"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </div>
  );
}

export default IntentActionButtons;