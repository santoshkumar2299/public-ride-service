import { useState, useEffect } from 'react';
import LocationSearch from '../LocationSearch';
import './FloatingCard.css';

function EmergencyFloatingCard({ userLocation, onClose }) {
  const [destination, setDestination] = useState('');
  const [currentStep, setCurrentStep] = useState(1); // 1: Destination, 2: Transport Options, 3: Booking
  const [transportOptions, setTransportOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [urgencyLevel, setUrgencyLevel] = useState('high'); // high, medium, low
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get contextual quick destinations based on time and patterns
  const getQuickDestinations = () => {
    const now = new Date();
    const hour = now.getHours();
    const isWeekday = now.getDay() >= 1 && now.getDay() <= 5;

    const contextualDestinations = [];

    // Morning rush hour (7-10 AM) - Work destinations
    if (hour >= 7 && hour <= 10 && isWeekday) {
      contextualDestinations.push(
        { name: 'Office/Workplace', icon: '🏢', confidence: 95 },
        { name: 'Metro Station', icon: '🚇', confidence: 90 },
        { name: 'Bus Terminal', icon: '🚌', confidence: 85 }
      );
    }
    // Evening rush hour (5-8 PM) - Home destinations
    else if (hour >= 17 && hour <= 20 && isWeekday) {
      contextualDestinations.push(
        { name: 'Home', icon: '🏠', confidence: 95 },
        { name: 'Railway Station', icon: '🚉', confidence: 90 },
        { name: 'Shopping Mall', icon: '🛒', confidence: 75 }
      );
    }
    // General destinations
    else {
      contextualDestinations.push(
        { name: 'Hospital', icon: '🏥', confidence: 90 },
        { name: 'Airport', icon: '✈️', confidence: 85 },
        { name: 'Railway Station', icon: '🚉', confidence: 80 }
      );
    }

    return contextualDestinations;
  };

  // Progress calculation
  const getProgress = () => {
    let completed = 0;
    if (destination) completed++;
    if (selectedOption) completed++;
    return (completed / 2) * 100;
  };

  // Step validation
  const canProceedToStep = (step) => {
    switch (step) {
      case 2: return destination.trim() !== '';
      case 3: return destination.trim() !== '' && selectedOption !== null;
      default: return true;
    }
  };

  // Generate transport options based on urgency and time
  const generateTransportOptions = () => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const now = new Date();
      const hour = now.getHours();
      const isRushHour = (hour >= 7 && hour <= 10) || (hour >= 17 && hour <= 20);

      const options = [];

      // Hero option - fastest available
      if (urgencyLevel === 'high') {
        options.push({
          id: 'hero',
          type: 'auto',
          name: 'Auto Rickshaw',
          icon: '🛺',
          time: '3-5 min',
          price: '₹80-120',
          confidence: 95,
          isHero: true,
          features: ['Fastest', 'Available now', 'Direct route']
        });
      }

      // Alternative options
      if (!isRushHour) {
        options.push({
          id: 'ride',
          type: 'ride',
          name: 'Shared Ride',
          icon: '🚗',
          time: '8-12 min',
          price: '₹60-90',
          confidence: 85,
          features: ['Good value', '2 seats available', 'AC car']
        });
      }

      options.push({
        id: 'bus',
        type: 'bus',
        name: 'Express Bus',
        icon: '🚌',
        time: '15-20 min',
        price: '₹15-25',
        confidence: 70,
        features: ['Eco-friendly', 'Regular service', 'Multiple stops']
      });

      setTransportOptions(options);
      setIsLoading(false);
    }, 1500);
  };

  // Handle destination selection
  const handleDestinationSelect = (selectedDest) => {
    setDestination(selectedDest.display_name || selectedDest.name);
    setCurrentStep(2);
    generateTransportOptions();
  };

  // Handle quick destination selection
  const handleQuickDestination = (dest) => {
    setDestination(dest.name);
    setCurrentStep(2);
    generateTransportOptions();
  };

  // Handle transport option selection
  const handleOptionSelect = (option) => {
    setSelectedOption(option);
    setCurrentStep(3);
  };

  // Handle booking
  const handleBooking = async () => {
    setIsSubmitting(true);
    
    // Simulate booking process
    setTimeout(() => {
      setIsSubmitting(false);
      onClose();
      
      // Show success notification
      if (window.showNotification) {
        window.showNotification('🚀 Emergency transport booked! Driver details sent to your phone.');
      }
    }, 2000);
  };

  // Handle ESC key
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
    <div className="floating-card-overlay emergency-overlay">
      <div className="emergency-card">
        {/* Emergency Header - Minimal for clarity */}
        <div className="emergency-header">
          <div className="emergency-status">
            <div className="status-indicator pulse-red"></div>
            <span className="status-text">Emergency Transport</span>
            <span className="step-indicator">Step {currentStep}/3</span>
          </div>
          <button 
            className="emergency-close" 
            onClick={onClose}
            aria-label="Cancel emergency"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Emergency Content */}
        <div className="emergency-content">
        {/* Step 1: Destination Selection */}
        {currentStep === 1 && (
          <div className="emergency-step">
            <div className="step-title">
              <h2>Where do you need to go?</h2>
              <p className="step-subtitle">Get fastest transport options</p>
            </div>
            
            {/* Urgency Level - Prominent Selection */}
            <div className="urgency-section">
              <h3 className="urgency-label">Urgency Level</h3>
              <div className="urgency-buttons">
                <button 
                  className={`urgency-choice critical ${urgencyLevel === 'high' ? 'selected' : ''}`}
                  onClick={() => setUrgencyLevel('high')}
                >
                  <div className="urgency-icon">🚨</div>
                  <div className="urgency-text">
                    <span className="urgency-main">Critical</span>
                    <span className="urgency-desc">Immediate help needed</span>
                  </div>
                </button>
                <button 
                  className={`urgency-choice medium ${urgencyLevel === 'medium' ? 'selected' : ''}`}
                  onClick={() => setUrgencyLevel('medium')}
                >
                  <div className="urgency-icon">⚡</div>
                  <div className="urgency-text">
                    <span className="urgency-main">Urgent</span>
                    <span className="urgency-desc">Need transport soon</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Quick Destinations - Professional Cards */}
            <div className="destination-section">
              <h3 className="destination-label">Quick Destinations</h3>
              <div className="destination-grid">
                {getQuickDestinations().map((dest, index) => (
                  <button
                    key={index}
                    className="destination-card"
                    onClick={() => handleQuickDestination(dest)}
                  >
                    <div className="dest-icon-wrapper">
                      <span className="dest-icon">{dest.icon}</span>
                    </div>
                    <div className="dest-info">
                      <span className="dest-name">{dest.name}</span>
                      <span className="dest-confidence">{dest.confidence}% match</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Location Search */}
            <div className="search-section">
              <div className="search-header">
                <h3 className="search-label">Or Search Location</h3>
              </div>
              <div className="search-wrapper">
                <LocationSearch
                  onLocationSelect={handleDestinationSelect}
                  placeholder="Search any address or landmark..."
                  showCurrentLocation={true}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Transport Options */}
        {currentStep === 2 && (
          <div className="emergency-step">
            <div className="step-title">
              <h2>Choose Transport</h2>
              <div className="destination-display">
                <span className="dest-label">To:</span>
                <span className="dest-value">{destination}</span>
              </div>
            </div>

            {isLoading ? (
              <div className="loading-state">
                <div className="loading-animation">
                  <div className="pulse-circle"></div>
                  <div className="pulse-circle delay-1"></div>
                  <div className="pulse-circle delay-2"></div>
                </div>
                <h3 className="loading-title">Finding fastest routes</h3>
                <p className="loading-subtitle">Checking all available options...</p>
              </div>
            ) : (
              <div className="options-section">
                {transportOptions.map((option) => (
                  <button
                    key={option.id}
                    className={`transport-card ${option.isHero ? 'hero-card' : 'standard-card'} ${selectedOption?.id === option.id ? 'selected' : ''}`}
                    onClick={() => handleOptionSelect(option)}
                  >
                    {option.isHero && <div className="hero-badge">⚡ FASTEST</div>}
                    <div className="card-content">
                      <div className="transport-icon">{option.icon}</div>
                      <div className="transport-info">
                        <div className="transport-name">{option.name}</div>
                        <div className="transport-time">{option.time}</div>
                        <div className="transport-features">
                          {option.features.map((feature, index) => (
                            <span key={index} className="feature-pill">{feature}</span>
                          ))}
                        </div>
                      </div>
                      <div className="transport-price">
                        <span className="price-value">{option.price}</span>
                        <span className="price-label">Est. fare</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Navigation */}
            <div className="step-navigation">
              <button className="nav-back" onClick={() => setCurrentStep(1)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M19 12H6m0 0l6 6m-6-6l6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Back
              </button>
              {selectedOption && (
                <button 
                  className="nav-continue emergency-btn"
                  onClick={() => setCurrentStep(3)}
                >
                  Continue
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12h14m0 0l-6 6m6-6l-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Booking Confirmation */}
        {currentStep === 3 && (
          <div className="emergency-step">
            <div className="step-title">
              <h2>Confirm Emergency Booking</h2>
              <p className="step-subtitle">Review details before proceeding</p>
            </div>
            
            {/* Booking Summary Card */}
            <div className="booking-card">
              <div className="booking-header">
                <div className="booking-icon">{selectedOption?.icon}</div>
                <div className="booking-title">
                  <h3>{selectedOption?.name}</h3>
                  <p className="booking-subtitle">Emergency Transport</p>
                </div>
              </div>
              
              <div className="booking-details">
                <div className="detail-row">
                  <span className="detail-label">From</span>
                  <span className="detail-value">Your current location</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">To</span>
                  <span className="detail-value">{destination}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Arrival Time</span>
                  <span className="detail-value">{selectedOption?.time}</span>
                </div>
                <div className="detail-row highlighted">
                  <span className="detail-label">Est. Fare</span>
                  <span className="detail-value">{selectedOption?.price}</span>
                </div>
              </div>
            </div>

            {/* Final Actions */}
            <div className="booking-actions">
              <button className="action-back" onClick={() => setCurrentStep(2)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M19 12H6m0 0l6 6m-6-6l6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Back
              </button>
              <button 
                className="action-book emergency-primary"
                onClick={handleBooking}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="booking-spinner"></div>
                    <span>Booking...</span>
                  </>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>Book Emergency Transport</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
    </div>
  );
}

export default EmergencyFloatingCard;