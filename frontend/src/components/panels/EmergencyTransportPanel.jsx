import { useState, useEffect } from 'react';
import OptimizationPreferences from '../OptimizationPreferences';

function EmergencyTransportPanel({ userLocation, onClose, screenSize }) {
  const [destination, setDestination] = useState('');
  const [transportOptions, setTransportOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [showPreferences, setShowPreferences] = useState(false);
  const [userPreferences, setUserPreferences] = useState(null);
  const [searchValue, setSearchValue] = useState('');

  // MANDATORY: ESC key support for human UX
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        if (countdown) {
          setCountdown(null);
        } else if (destination) {
          setDestination('');
          setTransportOptions([]);
        } else {
          onClose();
        }
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [countdown, destination, onClose]);

  // Get contextual destinations (same logic as modal)
  const getContextualDestinations = () => {
    const hour = new Date().getHours();
    const isWeekday = new Date().getDay() >= 1 && new Date().getDay() <= 5;
    
    if (hour >= 7 && hour <= 10 && isWeekday) {
      return [
        { name: 'Office - Gachibowli', address: 'HITEC City, Hyderabad', context: '🏢 Work time' },
        { name: 'Airport', address: 'Rajiv Gandhi International Airport', context: '✈️ Travel' },
        { name: 'Meeting Room - Forum Mall', address: 'Forum Sujana Mall', context: '🤝 Meeting spot' }
      ];
    }
    
    if (hour >= 17 && hour <= 20) {
      return [
        { name: 'Home - Kondapur', address: 'Kondapur, Hyderabad', context: '🏠 Going home' },
        { name: 'Metro Station', address: 'Ameerpet Metro', context: '🚇 Quick transit' },
        { name: 'Gym - Banjara Hills', address: 'Banjara Hills', context: '💪 Workout time' }
      ];
    }
    
    return [
      { name: 'Airport', address: 'Rajiv Gandhi International Airport', context: '✈️ Travel hub' },
      { name: 'Railway Station', address: 'Secunderabad Railway Station', context: '🚂 Rail connect' },
      { name: 'City Center', address: 'Begumpet, Hyderabad', context: '🏙️ Central area' }
    ];
  };

  const contextualDestinations = getContextualDestinations();

  // Generate transport options (same logic as modal)
  const generateTransportOptions = (dest) => {
    setIsLoading(true);
    
    setTimeout(() => {
      const options = [
        {
          id: 1,
          type: 'ride',
          provider: 'Ola',
          totalTime: 12,
          pickupTime: 2,
          travelTime: 10,
          price: 85,
          confidence: 95,
          icon: '🚗',
          reasoning: 'Fastest + most reliable'
        },
        {
          id: 2,
          type: 'auto',
          provider: 'Nearby Auto',
          totalTime: 15,
          pickupTime: 0.5,
          travelTime: 14.5,
          price: 60,
          confidence: 80,
          icon: '🛺',
          reasoning: 'Budget option'
        }
      ];
      
      setTransportOptions(options);
      setIsLoading(false);
    }, 1500);
  };

  // Load user preferences
  useEffect(() => {
    const savedPrefs = localStorage.getItem('fastTransportPreferences');
    if (savedPrefs) {
      setUserPreferences(JSON.parse(savedPrefs));
    } else {
      setShowPreferences(true);
    }
  }, []);

  const handleDestinationSelect = (dest) => {
    setDestination(dest.name);
    generateTransportOptions(dest);
  };

  const handleSearchSubmit = () => {
    if (searchValue.trim()) {
      const customDest = { name: searchValue.trim(), address: searchValue.trim() };
      handleDestinationSelect(customDest);
      setSearchValue('');
    }
  };

  const handleBookFastest = () => {
    if (transportOptions.length > 0) {
      const fastest = transportOptions[0];
      
      if (userPreferences?.optimizationLevel === 2) {
        setCountdown(10);
        const timer = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(timer);
              alert(`Booked ${fastest.provider}! ETA: ${fastest.totalTime} minutes.`);
              onClose();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else if (userPreferences?.optimizationLevel === 3) {
        alert(`Booked ${fastest.provider}! ETA: ${fastest.totalTime} minutes.`);
        onClose();
      } else {
        if (confirm(`Book ${fastest.provider} for ₹${fastest.price}? ETA: ${fastest.totalTime} minutes`)) {
          alert(`Booked ${fastest.provider}! ETA: ${fastest.totalTime} minutes.`);
          onClose();
        }
      }
    }
  };

  const handlePreferencesSet = (preferences) => {
    setUserPreferences(preferences);
    setShowPreferences(false);
  };

  return (
    <div className="emergency-transport-panel">
      {/* Panel Header */}
      <div className="panel-header">
        <div className="panel-title">
          <span className="panel-icon">🚀</span>
          <div>
            <h2>I'm Late!</h2>
            <p>Find fastest transport</p>
          </div>
        </div>
        <button className="panel-close" onClick={onClose}>✕</button>
      </div>

      {/* Panel Content */}
      <div className="panel-content">
        {!destination && (
          <div className="destination-selection">
            <h3>Where to?</h3>
            
            {/* Quick Search */}
            <div className="quick-search">
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Type destination..."
                className="search-input"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && searchValue.trim()) {
                    handleSearchSubmit();
                  }
                }}
              />
              {searchValue && (
                <button className="search-submit" onClick={handleSearchSubmit}>
                  Go
                </button>
              )}
            </div>

            {/* Contextual Destinations */}
            <div className="quick-destinations">
              <h4>Quick suggestions:</h4>
              {contextualDestinations.map((dest, index) => (
                <button
                  key={index}
                  className="destination-quick-btn"
                  onClick={() => handleDestinationSelect(dest)}
                >
                  <span className="dest-name">{dest.name}</span>
                  <span className="dest-context">{dest.context}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading State */}
        {destination && isLoading && (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <h3>Finding fastest options...</h3>
            <p>to {destination}</p>
          </div>
        )}

        {/* Transport Options */}
        {destination && !isLoading && transportOptions.length > 0 && (
          <div className="transport-options">
            <div className="options-header">
              <h3>🚀 To {destination}</h3>
              <button 
                className="change-dest"
                onClick={() => {
                  setDestination('');
                  setTransportOptions([]);
                }}
              >
                Change
              </button>
            </div>

            {countdown && (
              <div className="countdown-bar">
                <span>Auto-booking in {countdown}s</span>
                <button onClick={() => setCountdown(null)}>Cancel</button>
              </div>
            )}

            {/* Hero Option */}
            {transportOptions[0] && (
              <div className="hero-option">
                <div className="option-header">
                  <span className="option-icon">{transportOptions[0].icon}</span>
                  <div>
                    <h4>{transportOptions[0].provider}</h4>
                    <span className="fastest-badge">FASTEST</span>
                  </div>
                </div>
                <div className="option-timing">
                  <span className="total-time">{transportOptions[0].totalTime} min</span>
                  <span className="price">₹{transportOptions[0].price}</span>
                </div>
                <div className="reasoning">{transportOptions[0].reasoning}</div>
              </div>
            )}

            {/* Book Button */}
            {!countdown && (
              <button 
                className="book-fastest-btn"
                onClick={handleBookFastest}
              >
                {userPreferences?.optimizationLevel === 3 ? '⚡ Book Now' : 'Book Fastest'}
              </button>
            )}

            {/* Alternative Options */}
            {transportOptions.length > 1 && (
              <div className="alternative-options">
                <h4>Alternatives:</h4>
                {transportOptions.slice(1).map((option) => (
                  <div key={option.id} className="alt-option">
                    <span className="alt-icon">{option.icon}</span>
                    <div className="alt-info">
                      <span className="alt-provider">{option.provider}</span>
                      <span className="alt-time">{option.totalTime}min • ₹{option.price}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Preferences Modal */}
      {showPreferences && (
        <OptimizationPreferences
          isOpen={showPreferences}
          onClose={() => setShowPreferences(false)}
          onPreferencesSet={handlePreferencesSet}
        />
      )}
    </div>
  );
}

export default EmergencyTransportPanel;