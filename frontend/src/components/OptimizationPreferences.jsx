import { useState, useEffect } from 'react';

function OptimizationPreferences({ isOpen, onClose, onPreferencesSet }) {
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [isFirstTime, setIsFirstTime] = useState(true);

  const optimizationLevels = [
    {
      id: 1,
      title: "Show Options",
      subtitle: "I'll choose myself",
      description: "Show me fastest options with clear choices. I decide what to book.",
      icon: "🎯",
      features: ["Smart sorting", "Clear timing info", "Manual booking"]
    },
    {
      id: 2, 
      title: "Smart Suggestions",
      subtitle: "Optimize but ask first",
      description: "Pre-select fastest option, but ask before booking. Save me time while keeping control.",
      icon: "⚡",
      features: ["Pre-selected fastest", "Auto-countdown", "One-tap cancel"]
    },
    {
      id: 3,
      title: "Quick Actions", 
      subtitle: "Streamline everything",
      description: "Pre-fill details, skip confirmations, focus purely on speed. For power users.",
      icon: "🚀",
      features: ["Pre-filled forms", "Skip confirmations", "Background optimization"]
    }
  ];

  // Check if user has set preferences before
  useEffect(() => {
    const savedPrefs = localStorage.getItem('fastTransportPreferences');
    if (savedPrefs) {
      setIsFirstTime(false);
      const prefs = JSON.parse(savedPrefs);
      setSelectedLevel(prefs.optimizationLevel || 1);
    }
  }, []);

  // MANDATORY: ESC key support for human UX
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        if (!isFirstTime) { // Allow ESC if not first-time setup
          onClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
      return () => document.removeEventListener('keydown', handleEscKey);
    }
  }, [isOpen, onClose, isFirstTime]);

  const handleSavePreferences = () => {
    const preferences = {
      optimizationLevel: selectedLevel,
      setAt: new Date().toISOString(),
      isFirstTime: false
    };
    
    localStorage.setItem('fastTransportPreferences', JSON.stringify(preferences));
    onPreferencesSet(preferences);
    onClose();
  };

  const handleSkip = () => {
    // Set default level 1 preferences
    const defaultPrefs = {
      optimizationLevel: 1,
      setAt: new Date().toISOString(),
      isFirstTime: false
    };
    
    localStorage.setItem('fastTransportPreferences', JSON.stringify(defaultPrefs));
    onPreferencesSet(defaultPrefs);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="preferences-modal-overlay">
      <div className="preferences-modal">
        <div className="preferences-header">
          <div className="header-icon">⚡</div>
          <h2>
            {isFirstTime ? "Fast Transport Setup" : "Update Preferences"}
          </h2>
          <p>
            {isFirstTime 
              ? "How should we help when you're running late?"
              : "Change how fast transport works for you"
            }
          </p>
          {!isFirstTime && (
            <button className="close-btn" onClick={onClose}>×</button>
          )}
        </div>

        <div className="optimization-levels">
          {optimizationLevels.map((level) => (
            <div
              key={level.id}
              className={`optimization-level ${selectedLevel === level.id ? 'selected' : ''}`}
              onClick={() => setSelectedLevel(level.id)}
            >
              <div className="level-header">
                <div className="level-icon">{level.icon}</div>
                <div className="level-titles">
                  <h3>{level.title}</h3>
                  <span className="level-subtitle">{level.subtitle}</span>
                </div>
                <div className="level-selector">
                  <div className={`radio ${selectedLevel === level.id ? 'selected' : ''}`}>
                    {selectedLevel === level.id && '✓'}
                  </div>
                </div>
              </div>
              
              <p className="level-description">{level.description}</p>
              
              <div className="level-features">
                {level.features.map((feature, idx) => (
                  <span key={idx} className="feature-tag">
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="preferences-actions">
          <button 
            className="save-preferences-btn"
            onClick={handleSavePreferences}
          >
            {isFirstTime ? "Set My Preference" : "Update Preference"}
          </button>
          
          {isFirstTime && (
            <button 
              className="skip-btn"
              onClick={handleSkip}
            >
              Skip (Use default)
            </button>
          )}
        </div>

        <div className="preferences-note">
          <span className="note-icon">💡</span>
          <span>You can change this anytime in settings</span>
        </div>
      </div>
    </div>
  );
}

export default OptimizationPreferences;