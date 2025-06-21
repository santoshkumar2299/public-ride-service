import { useState, useEffect } from 'react';

function PrioritySelector({ onPrioritySelect, onClose }) {
  const [selectedPriority, setSelectedPriority] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animate in
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  const priorities = [
    {
      id: 'speed',
      icon: '⚡',
      title: 'SPEED',
      subtitle: 'Get there fastest',
      transportOrder: ['🚗', '🛺', '🚇'],
      color: '#ff6b35',
      description: 'Prioritizes fastest routes and transport options'
    },
    {
      id: 'budget',
      icon: '💰',
      title: 'BUDGET',
      subtitle: 'Save money',
      transportOrder: ['🚌', '🚇', '🚗'],
      color: '#28a745',
      description: 'Shows most cost-effective transport options'
    },
    {
      id: 'eco',
      icon: '🌱',
      title: 'ECO-FRIENDLY',
      subtitle: 'Help environment',
      transportOrder: ['🚇', '🚌', '🚴'],
      color: '#20c997',
      description: 'Promotes sustainable and green transport'
    },
    {
      id: 'direct',
      icon: '🎯',
      title: 'DIRECT',
      subtitle: 'Least transfers',
      transportOrder: ['🚗', '🛺', '🚌'],
      color: '#6f42c1',
      description: 'Minimizes stops and transfers'
    }
  ];

  const handlePriorityClick = (priority) => {
    setSelectedPriority(priority.id);
    
    // Add slight delay for visual feedback
    setTimeout(() => {
      onPrioritySelect(priority.id);
    }, 300);
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  return (
    <div className={`priority-selector-overlay ${isVisible ? 'visible' : ''}`}>
      <div className="priority-selector-container">
        {/* Header */}
        <div className="priority-header">
          <h2 className="priority-title">
            <span className="title-icon">💡</span>
            What matters most to you?
          </h2>
          <p className="priority-subtitle">
            Choose your travel priority to see the best options
          </p>
          <button className="close-btn" onClick={handleClose}>×</button>
        </div>

        {/* Priority Cards */}
        <div className="priority-cards">
          {priorities.map((priority, index) => (
            <div
              key={priority.id}
              className={`priority-card ${selectedPriority === priority.id ? 'selected' : ''}`}
              onClick={() => handlePriorityClick(priority)}
              style={{
                '--card-color': priority.color,
                '--animation-delay': `${index * 0.1}s`
              }}
            >
              {/* Card Content */}
              <div className="card-content">
                <div className="card-icon-container">
                  <span className="card-icon">{priority.icon}</span>
                  {selectedPriority === priority.id && (
                    <div className="selection-indicator">✓</div>
                  )}
                </div>
                
                <div className="card-text">
                  <h3 className="card-title">{priority.title}</h3>
                  <p className="card-subtitle">{priority.subtitle}</p>
                </div>
                
                <div className="transport-preview">
                  {priority.transportOrder.map((transport, idx) => (
                    <span 
                      key={idx} 
                      className="transport-icon"
                      style={{ '--icon-delay': `${idx * 0.1}s` }}
                    >
                      {transport}
                    </span>
                  ))}
                </div>
              </div>

              {/* Hover Description */}
              <div className="card-description">
                {priority.description}
              </div>

              {/* Loading Animation for Selected */}
              {selectedPriority === priority.id && (
                <div className="card-loading">
                  <div className="loading-spinner"></div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Fun Facts Section */}
        <div className="fun-facts">
          <div className="fact-item">
            <span className="fact-icon">🚌</span>
            <span className="fact-text">5 buses tracked nearby</span>
          </div>
          <div className="fact-item">
            <span className="fact-icon">⚡</span>
            <span className="fact-text">Average wait time: 8 min</span>
          </div>
          <div className="fact-item">
            <span className="fact-icon">🌍</span>
            <span className="fact-text">12 users contributing live data</span>
          </div>
        </div>

        {/* Skip Option */}
        <div className="skip-section">
          <button 
            className="skip-btn"
            onClick={() => onPrioritySelect('balanced')}
          >
            Show all options equally
          </button>
        </div>
      </div>
    </div>
  );
}

export default PrioritySelector;