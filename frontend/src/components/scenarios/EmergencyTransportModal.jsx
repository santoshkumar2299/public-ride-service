import { useState, useEffect } from 'react';
import OptimizationPreferences from '../OptimizationPreferences';
import BookingFeedbackModal from '../BookingFeedbackModal';
import LocationSearch from '../LocationSearch';

function EmergencyTransportModal({ onClose, userLocation }) {
  const [destination, setDestination] = useState('');
  const [transportOptions, setTransportOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [showPreferences, setShowPreferences] = useState(false);
  const [userPreferences, setUserPreferences] = useState(null);
  
  // Enhanced UX state management
  const [showQuickList, setShowQuickList] = useState(true);
  
  // Post-booking feedback state
  const [showFeedback, setShowFeedback] = useState(false);
  const [bookedOption, setBookedOption] = useState(null);
  const [feedbackData, setFeedbackData] = useState(null);

  // Enhanced contextual intelligence with pattern learning
  const getContextualDestinations = () => {
    try {
      const now = new Date();
      const hour = now.getHours();
      const isWeekday = now.getDay() >= 1 && now.getDay() <= 5;
      const dayOfWeek = now.getDay();
      
      // Load learned destination patterns with safety
      let learningData = {};
      let learnedDestinations = {};
      
      try {
        learningData = JSON.parse(localStorage.getItem('transportLearningData') || '{}');
        learnedDestinations = learningData.destinations || {};
      } catch (storageError) {
        console.error('Error reading learning data:', storageError);
        learnedDestinations = {};
      }
    
    // Advanced context detection
    const context = {
      timeOfDay: hour < 6 ? 'early_morning' : 
                 hour < 10 ? 'morning_rush' :
                 hour < 12 ? 'late_morning' :
                 hour < 14 ? 'lunch_time' :
                 hour < 17 ? 'afternoon' :
                 hour < 20 ? 'evening_rush' :
                 hour < 22 ? 'evening' : 'night',
      dayType: isWeekday ? 'weekday' : 'weekend',
      urgencyLevel: 'high' // Since this is emergency transport
    };
    
    // Enhanced smart destination suggestions with learned patterns
    let suggestions = [];
    
    // Check for learned destinations for this time context
    try {
      const timeContextKey = hour.toString();
      if (learnedDestinations && learnedDestinations[timeContextKey]) {
        const learnedForTime = learnedDestinations[timeContextKey];
        
        // Add top learned destinations with safety checks
        if (learnedForTime && typeof learnedForTime === 'object') {
          Object.entries(learnedForTime)
            .filter(([dest, data]) => {
              return data && 
                     typeof data === 'object' && 
                     typeof data.confidence === 'number' && 
                     typeof data.count === 'number' &&
                     data.confidence > 60 && 
                     data.count > 1;
            })
            .sort(([,a], [,b]) => {
              const aScore = (a.confidence || 0) * (a.count || 0);
              const bScore = (b.confidence || 0) * (b.count || 0);
              return bScore - aScore;
            })
            .slice(0, 2)
            .forEach(([destination, data]) => {
              suggestions.push({
                name: destination,
                address: destination,
                context: '🧠 Your usual spot',
                confidence: Math.min(95, data.confidence || 70),
                reasoning: `You've chosen this ${data.count || 1} time${(data.count || 1) > 1 ? 's' : ''} before`,
                isLearned: true
              });
            });
        }
      }
    } catch (error) {
      console.error('Error processing learned destinations:', error);
      // Continue with default suggestions
    }
    
    // Add default suggestions based on context if we don't have enough learned ones
    if (context.timeOfDay === 'morning_rush' && context.dayType === 'weekday') {
      const defaults = [
        { 
          name: 'Office - Gachibowli', 
          address: 'HITEC City, Hyderabad', 
          context: '🏢 Work commute', 
          confidence: 95,
          reasoning: 'Most likely destination during weekday morning rush'
        },
        { 
          name: 'Airport', 
          address: 'Rajiv Gandhi International Airport', 
          context: '✈️ Travel urgency', 
          confidence: 80,
          reasoning: 'Flight departure stress'
        },
        { 
          name: 'Hospital - Apollo', 
          address: 'Apollo Hospital, Jubilee Hills', 
          context: '🏥 Medical emergency', 
          confidence: 70,
          reasoning: 'Emergency medical situation'
        }
      ];
      
      // Add defaults that aren't already in learned suggestions
      defaults.forEach(defaultDest => {
        if (!suggestions.some(s => s.name.includes(defaultDest.name.split(' - ')[0]))) {
          suggestions.push(defaultDest);
        }
      });
      
      return suggestions.slice(0, 3);
    }
    } catch (error) {
      console.error('Error in getContextualDestinations:', error);
      // Return fallback suggestions
      return [
        { 
          name: 'Airport', 
          address: 'Rajiv Gandhi International Airport', 
          context: '✈️ Travel hub', 
          confidence: 85,
          reasoning: 'Most common emergency destination'
        },
        { 
          name: 'City Center', 
          address: 'Begumpet, Hyderabad', 
          context: '🏙️ Central area', 
          confidence: 60,
          reasoning: 'General city access'
        }
      ];
    }
  };
    
    if (context.timeOfDay === 'evening_rush') {
      return [
        { 
          name: 'Home - Kondapur', 
          address: 'Kondapur, Hyderabad', 
          context: '🏠 Going home', 
          confidence: 90,
          reasoning: 'End of workday commute'
        },
        { 
          name: 'Metro Station', 
          address: 'Ameerpet Metro', 
          context: '🚇 Quick transit', 
          confidence: 85,
          reasoning: 'Avoid traffic congestion'
        },
        { 
          name: 'Shopping Mall', 
          address: 'Forum Sujana Mall', 
          context: '🛍️ Evening plans', 
          confidence: 60,
          reasoning: 'After-work activities'
        }
      ];
    }
    
    if (context.timeOfDay === 'lunch_time') {
      return [
        { 
          name: 'Restaurant District', 
          address: 'Banjara Hills', 
          context: '🍽️ Lunch meeting', 
          confidence: 80,
          reasoning: 'Business lunch timing'
        },
        { 
          name: 'Office - Return', 
          address: 'HITEC City, Hyderabad', 
          context: '🏢 Back to work', 
          confidence: 70,
          reasoning: 'Return from lunch break'
        },
        { 
          name: 'Airport', 
          address: 'Rajiv Gandhi International Airport', 
          context: '✈️ Flight departure', 
          confidence: 90,
          reasoning: 'Critical flight timing'
        }
      ];
    }
    
    if (context.dayType === 'weekend') {
      return [
        { 
          name: 'Airport', 
          address: 'Rajiv Gandhi International Airport', 
          context: '✈️ Weekend travel', 
          confidence: 85,
          reasoning: 'Vacation or weekend trip'
        },
        { 
          name: 'Mall/Entertainment', 
          address: 'GVK One Mall', 
          context: '🎉 Weekend fun', 
          confidence: 70,
          reasoning: 'Weekend leisure activities'
        },
        { 
          name: 'Hospital - Emergency', 
          address: 'Apollo Hospital', 
          context: '🚑 Medical urgency', 
          confidence: 80,
          reasoning: 'Weekend medical emergency'
        }
      ];
    }
    
    // Night time scenarios
    if (context.timeOfDay === 'night') {
      return [
        { 
          name: 'Home - Safe Return', 
          address: 'Your Location', 
          context: '🏠 Safe journey home', 
          confidence: 95,
          reasoning: 'Late night safety priority'
        },
        { 
          name: 'Hospital - Emergency', 
          address: 'Nearest Emergency Hospital', 
          context: '🚑 Medical emergency', 
          confidence: 90,
          reasoning: 'Night medical urgency'
        },
        { 
          name: 'Airport', 
          address: 'Rajiv Gandhi International Airport', 
          context: '✈️ Late flight', 
          confidence: 80,
          reasoning: 'Red-eye flight departure'
        }
      ];
    }
    
    // Default fallback
    return [
      { 
        name: 'Airport', 
        address: 'Rajiv Gandhi International Airport', 
        context: '✈️ Travel hub', 
        confidence: 85,
        reasoning: 'Most common emergency destination'
      },
      { 
        name: 'Railway Station', 
        address: 'Secunderabad Railway Station', 
        context: '🚂 Rail connect', 
        confidence: 70,
        reasoning: 'Alternative travel option'
      },
      { 
        name: 'City Center', 
        address: 'Begumpet, Hyderabad', 
        context: '🏙️ Central area', 
        confidence: 60,
        reasoning: 'General city access'
      }
    ];
  };
  
  const contextualDestinations = getContextualDestinations();

  // Enhanced transport options with better UX
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingSteps, setLoadingSteps] = useState([]);
  
  const generateTransportOptions = (dest) => {
    try {
      console.log('Generating transport options for:', dest);
      
      if (!dest || (!dest.name && !dest.address)) {
        console.error('Invalid destination:', dest);
        return;
      }
      
      setIsLoading(true);
      setLoadingProgress(0);
      setLoadingSteps([]);
    
    // Progressive loading with transparency (reduces anxiety)
    const steps = [
      { text: 'Scanning nearby cabs...', delay: 300 },
      { text: 'Checking real-time traffic...', delay: 400 },
      { text: 'Getting best prices...', delay: 500 },
      { text: 'Found your fastest option!', delay: 300 }
    ];
    
    let currentStep = 0;
    const progressInterval = setInterval(() => {
      if (currentStep < steps.length) {
        setLoadingSteps(prev => [...prev, { ...steps[currentStep], completed: true }]);
        setLoadingProgress(((currentStep + 1) / steps.length) * 100);
        currentStep++;
      } else {
        clearInterval(progressInterval);
        
          // Generate contextually optimized options with smart defaults
        const baseOptions = [
          {
            id: 1,
            type: 'ride',
            provider: 'Ola',
            totalTime: 12,
            pickupTime: 2,
            travelTime: 10,
            price: 85,
            confidence: 95,
            icon: '🚗'
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
            icon: '🛺'
          },
          {
            id: 3,
            type: 'bus',
            provider: 'Bus 45',
            totalTime: 18,
            pickupTime: 3,
            travelTime: 15,
            price: 25,
            confidence: 70,
            icon: '🚌'
          }
        ];
        
        // Apply smart defaults based on user preferences and context
        const hour = new Date().getHours();
        const isRushHour = (hour >= 7 && hour <= 10) || (hour >= 17 && hour <= 20);
        
        // Context-aware option enhancement
        const enhancedOptions = baseOptions.map((option, index) => {
          let reasoning = '';
          let priorityBoost = 0;
          
          // Rush hour logic: Autos are faster due to traffic flexibility
          if (isRushHour && option.type === 'auto') {
            reasoning = 'Beats traffic jams';
            priorityBoost = 5; // Boost auto during rush hour
            option.totalTime = Math.max(8, option.totalTime - 3); // Reduce time estimate
          } else if (isRushHour && option.type === 'ride') {
            reasoning = 'AC comfort in traffic';
            option.totalTime += 5; // Add traffic delay
          } else if (option.type === 'ride' && !isRushHour) {
            reasoning = 'Fastest + most reliable';
            priorityBoost = 10;
          } else if (option.type === 'auto') {
            reasoning = 'Quick & flexible';
          } else if (option.type === 'bus') {
            reasoning = 'Budget-friendly';
          }
          
          // Apply user preference learning (if available)
          if (userPreferences?.preferredMode === option.type) {
            priorityBoost += 8;
            reasoning += ' (Your usual choice)';
          }
          
          return {
            ...option,
            reasoning,
            priorityScore: (100 - option.totalTime) + priorityBoost,
            isHero: index === 0 // Will be re-sorted below
          };
        });
        
        // Re-sort by priority score to determine hero option
        const sortedOptions = enhancedOptions.sort((a, b) => b.priorityScore - a.priorityScore);
        
        // Mark the best option as hero
        const options = sortedOptions.map((option, index) => ({
          ...option,
          isHero: index === 0
        }));
        
        setTransportOptions(options);
        setIsLoading(false);
      }
    }, steps[currentStep]?.delay || 300);
    
    } catch (error) {
      console.error('Error generating transport options:', error);
      setIsLoading(false);
      // Show error state or fallback
      alert('Unable to load transport options. Please try again.');
    }
  };

  // MANDATORY: ESC key support with smart context awareness (following HUMAN_UX_PRINCIPLES.md)
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        // Smart ESC behavior based on context
        if (countdown) {
          setCountdown(null); // Cancel auto-booking if active
        } else if (destination) {
          // If destination selected, go back to destination selection
          setDestination('');
          setTransportOptions([]);
          setShowQuickList(true);
        } else {
          // Finally close modal
          onClose();
        }
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [countdown, showQuickList, destination, onClose]);

  // Enhanced user preferences with pattern learning
  useEffect(() => {
    const savedPrefs = localStorage.getItem('fastTransportPreferences');
    const usageHistory = JSON.parse(localStorage.getItem('transportUsageHistory') || '[]');
    
    if (savedPrefs) {
      const prefs = JSON.parse(savedPrefs);
      
      // Learn from usage patterns
      if (usageHistory.length > 3) {
        const recentChoices = usageHistory.slice(-5);
        const preferredMode = recentChoices.reduce((acc, choice) => {
          acc[choice.type] = (acc[choice.type] || 0) + 1;
          return acc;
        }, {});
        
        const mostUsed = Object.keys(preferredMode).reduce((a, b) => 
          preferredMode[a] > preferredMode[b] ? a : b
        );
        
        prefs.preferredMode = mostUsed;
        prefs.learningScore = usageHistory.length;
      }
      
      setUserPreferences(prefs);
    } else {
      // First time user - show preferences setup
      setShowPreferences(true);
    }
  }, []);
  
  // Save usage pattern for learning
  const saveUsagePattern = (option) => {
    const usageHistory = JSON.parse(localStorage.getItem('transportUsageHistory') || '[]');
    const newEntry = {
      type: option.type,
      provider: option.provider,
      time: new Date().toISOString(),
      context: {
        hour: new Date().getHours(),
        isWeekday: new Date().getDay() >= 1 && new Date().getDay() <= 5,
        destination: destination
      }
    };
    
    usageHistory.push(newEntry);
    
    // Keep only last 20 entries for pattern learning
    if (usageHistory.length > 20) {
      usageHistory.shift();
    }
    
    localStorage.setItem('transportUsageHistory', JSON.stringify(usageHistory));
  };

  // Note: ESC key handling is implemented above with smart context awareness

  const handleDestinationSelect = (dest) => {
    setDestination(dest.name);
    setShowQuickList(false);
    generateTransportOptions(dest);
  };
  
  const handleToggleQuickList = () => {
    setShowQuickList(!showQuickList);
  };

  const handlePreferencesSet = (preferences) => {
    setUserPreferences(preferences);
    setShowPreferences(false);
  };

  const showBookingFeedback = (option) => {
    // Save usage pattern for learning
    saveUsagePattern(option);
    
    // Prepare feedback data
    const currentContext = {
      timeOfDay: new Date().getHours(),
      dayType: new Date().getDay() >= 1 && new Date().getDay() <= 5 ? 'weekday' : 'weekend',
      destination: destination,
      transportType: option.type,
      provider: option.provider
    };
    
    setBookedOption(option);
    setFeedbackData(currentContext);
    setShowFeedback(true);
  };
  
  const handleBookFastest = () => {
    if (transportOptions.length > 0) {
      const fastest = transportOptions[0];
      
      // Enhanced booking flow with context awareness
      const bookingMessage = `🚀 ${fastest.provider} booked successfully!\n\n⏱️ ETA: ${fastest.totalTime} minutes\n💰 Price: ₹${fastest.price}\n📱 Track on your phone\n\n${fastest.reasoning}`;
      
      // Apply user preference for booking behavior with smart defaults
      if (userPreferences?.optimizationLevel === 2) {
        // Smart suggestions - show countdown with context
        const countdownTime = fastest.confidence > 90 ? 8 : 10; // Shorter countdown for high confidence
        setCountdown(countdownTime);
        
        const timer = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(timer);
              alert(bookingMessage);
              showBookingFeedback(fastest);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else if (userPreferences?.optimizationLevel === 3) {
        // Quick actions - immediate booking with success feedback
        setTimeout(() => {
          alert(bookingMessage);
          showBookingFeedback(fastest);
        }, 100); // Small delay for UX smoothness
      } else {
        // Enhanced manual confirmation with context
        const confirmMessage = `🚀 Book ${fastest.provider}?\n\n⏱️ ${fastest.totalTime} minutes\n💰 ₹${fastest.price}\n🎯 ${fastest.reasoning}\n✅ ${fastest.confidence}% confident`;
        
        if (confirm(confirmMessage)) {
          alert(bookingMessage);
          showBookingFeedback(fastest);
        }
      }
    }
  };

  const handleManualBook = (option) => {
    const bookingMessage = `🚀 ${option.provider} booking initiated!\n\n⏱️ ETA: ${option.totalTime} minutes\n💰 Price: ₹${option.price}\n🎯 ${option.reasoning}\n\nRedirecting to ${option.provider} app...`;
    
    alert(bookingMessage);
    showBookingFeedback(option);
  };
  
  const handleFeedbackSubmit = (feedback) => {
    // Save feedback to enhance future suggestions
    const feedbackEntry = {
      ...feedbackData,
      feedback: feedback,
      timestamp: new Date().toISOString(),
      helpful: feedback.wasHelpful,
      futureUse: feedback.useForFuture
    };
    
    // Update learning data
    const learningData = JSON.parse(localStorage.getItem('transportLearningData') || '{}');
    
    // Destination learning
    if (feedback.useForFuture && feedback.destinationFeedback) {
      if (!learningData.destinations) learningData.destinations = {};
      if (!learningData.destinations[feedbackData.timeOfDay]) {
        learningData.destinations[feedbackData.timeOfDay] = {};
      }
      
      const timeKey = feedbackData.timeOfDay;
      const destKey = feedbackData.destination;
      
      if (!learningData.destinations[timeKey][destKey]) {
        learningData.destinations[timeKey][destKey] = { count: 0, confidence: 0 };
      }
      
      learningData.destinations[timeKey][destKey].count += 1;
      learningData.destinations[timeKey][destKey].confidence = Math.min(95, 
        learningData.destinations[timeKey][destKey].confidence + (feedback.wasHelpful ? 10 : -5)
      );
    }
    
    // Transport preference learning
    if (feedback.useForFuture && feedback.transportFeedback) {
      if (!learningData.transportPrefs) learningData.transportPrefs = {};
      const contextKey = `${feedbackData.dayType}_${feedbackData.timeOfDay}`;
      
      if (!learningData.transportPrefs[contextKey]) {
        learningData.transportPrefs[contextKey] = {};
      }
      
      const transportKey = feedbackData.transportType;
      if (!learningData.transportPrefs[contextKey][transportKey]) {
        learningData.transportPrefs[contextKey][transportKey] = { preference: 0, count: 0 };
      }
      
      learningData.transportPrefs[contextKey][transportKey].count += 1;
      learningData.transportPrefs[contextKey][transportKey].preference += feedback.wasHelpful ? 1 : -0.5;
    }
    
    localStorage.setItem('transportLearningData', JSON.stringify(learningData));
    
    setShowFeedback(false);
    onClose();
  };

  return (
    <div className="emergency-modal-overlay">
      <div className="emergency-modal">
        {/* Header */}
        <div className="emergency-header">
          <div className="emergency-icon">🚀</div>
          <h2>I'm Late! Fast Transport</h2>
          <p>Getting you there fast • Press ESC anytime to exit</p>
          <div className="header-actions">
            <button className="close-btn" onClick={onClose} title="Close and go back to map">
              ✕ Close
            </button>
          </div>
        </div>

        {/* Enhanced Destination Selection with Smart UX Flow */}
        {!destination && (
          <div className="destination-section">
            <div className="destination-header">
              <h3>Where are you rushing to?</h3>
              <button className="toggle-suggestions" onClick={handleToggleQuickList}>
                {showQuickList ? '↑ Hide suggestions' : '↓ Show suggestions'}
              </button>
            </div>
            
            {/* Real Address Search - Using Existing High-Quality Component */}
            <div className="address-search-container">
              <LocationSearch
                onLocationSelect={(location) => {
                  console.log('LocationSearch selected:', location);
                  
                  // Safely handle location data
                  const address = location.address || location.name || 'Selected Location';
                  const destination = {
                    name: address.split(',')[0].trim() || address,
                    address: address,
                    lat: location.lat,
                    lng: location.lng || location.lon
                  };
                  
                  console.log('Processed destination:', destination);
                  handleDestinationSelect(destination);
                }}
                placeholder="Where are you rushing to?"
                referenceLocation={userLocation}
                fastMode={true}
              />
              
              {/* Search Mode Helper */}
              <div className="search-helper">
                <span className="helper-text">
                  💡 Type address, landmark, or area name - or pick from suggestions below
                </span>
              </div>
            </div>
            
            {/* Quick Destinations - Show when not in search mode OR when search is focused */}
            {showQuickList && (
              <div className="contextual-destinations">
                <div className="suggestions-header">
                  <span className="suggestions-title">
                    ⚡ Quick destinations for right now:
                  </span>
                </div>
                {contextualDestinations.map((dest, index) => (
                  <button
                    key={index}
                    className="destination-btn contextual"
                    onClick={() => handleDestinationSelect(dest)}
                  >
                    <div className="dest-main">
                      <span className="dest-name">{dest.name}</span>
                      <span className="dest-context">{dest.context}</span>
                    </div>
                    <span className="dest-address">{dest.address}</span>
                  </button>
                ))}
              </div>
            )}
            
          </div>
        )}

        {/* Enhanced Loading State with Progress Transparency */}
        {destination && isLoading && (
          <div className="loading-section">
            <div className="loading-header">
              <div className="loading-spinner"></div>
              <h3>Finding your fastest route...</h3>
            </div>
            
            <div className="loading-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${loadingProgress}%` }}
                ></div>
              </div>
              
              <div className="loading-steps">
                {loadingSteps.map((step, index) => (
                  <div key={index} className="loading-step completed">
                    <span className="step-icon">✅</span>
                    <span className="step-text">{step.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Hero + Alternative Options Layout */}
        {destination && !isLoading && transportOptions.length > 0 && (
          <div className="options-section">
            <div className="options-header">
              <div className="destination-info">
                <h3>🚀 Getting you to {destination}</h3>
                <button 
                  className="change-destination" 
                  onClick={() => {
                    setDestination('');
                    setTransportOptions([]);
                    setShowQuickList(true);
                  }}
                  title="Change destination"
                >
                  📍 Change destination
                </button>
              </div>
              <div className="optimization-info">
                <span className="optimization-level">
                  {userPreferences?.optimizationLevel === 1 && "📋 Manual Selection"}
                  {userPreferences?.optimizationLevel === 2 && "⚡ Smart Suggestions"}
                  {userPreferences?.optimizationLevel === 3 && "🚀 Quick Actions"}
                </span>
                <button 
                  className="change-prefs-btn"
                  onClick={() => setShowPreferences(true)}
                >
                  Settings
                </button>
              </div>
            </div>
            
            {countdown && (
              <div className="auto-book-countdown">
                <div className="countdown-content">
                  <span className="countdown-number">{countdown}</span>
                  <p>Booking fastest option...</p>
                </div>
                <button className="cancel-auto-book" onClick={() => setCountdown(null)}>Cancel</button>
              </div>
            )}

            {/* Hero Option (80% of focus) */}
            {transportOptions[0] && (
              <div className="hero-option" onClick={() => handleManualBook(transportOptions[0])}>
                <div className="hero-header">
                  <div className="hero-icon">{transportOptions[0].icon}</div>
                  <div className="hero-title">
                    <h4>{transportOptions[0].provider}</h4>
                    <span className="hero-reasoning">{transportOptions[0].reasoning}</span>
                  </div>
                  <div className="fastest-badge">FASTEST</div>
                </div>
                
                <div className="hero-timing">
                  <div className="total-time">{transportOptions[0].totalTime} MINUTES</div>
                  <div className="confidence-indicator">
                    <span className="confidence-text">{transportOptions[0].confidence}% confident</span>
                    <div className="confidence-bar">
                      <div 
                        className="confidence-fill" 
                        style={{ width: `${transportOptions[0].confidence}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                
                <div className="hero-price">
                  <span className="price-amount">₹{transportOptions[0].price}</span>
                  <span className="price-label">estimated</span>
                </div>
              </div>
            )}

            {/* Primary Action Button */}
            {!countdown && (
              <button 
                className={`hero-book-btn ${userPreferences?.optimizationLevel === 3 ? 'instant-book' : ''}`}
                onClick={handleBookFastest}
              >
                {userPreferences?.optimizationLevel === 1 && `Confirm Booking - ${transportOptions[0]?.totalTime} min`}
                {userPreferences?.optimizationLevel === 2 && `Smart Book - ${transportOptions[0]?.totalTime} min`}
                {userPreferences?.optimizationLevel === 3 && `⚡ Book Now - ${transportOptions[0]?.totalTime} min`}
              </button>
            )}

            {/* Alternative Options (20% of focus) */}
            {transportOptions.length > 1 && (
              <div className="alternative-options">
                <div className="alternatives-header">
                  <span>Other options:</span>
                </div>
                <div className="alternatives-grid">
                  {transportOptions.slice(1).map((option) => (
                    <button
                      key={option.id}
                      className="alternative-option"
                      onClick={() => handleManualBook(option)}
                    >
                      <div className="alt-icon">{option.icon}</div>
                      <div className="alt-info">
                        <div className="alt-time">{option.totalTime}min</div>
                        <div className="alt-price">₹{option.price}</div>
                      </div>
                      <div className="alt-label">{option.reasoning}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Optimization Preferences Modal */}
        <OptimizationPreferences
          isOpen={showPreferences}
          onClose={() => setShowPreferences(false)}
          onPreferencesSet={handlePreferencesSet}
        />
        
        {/* Post-Booking Feedback Modal */}
        {showFeedback && (
          <BookingFeedbackModal
            isOpen={showFeedback}
            bookedOption={bookedOption}
            destination={destination}
            onClose={() => {
              setShowFeedback(false);
              onClose();
            }}
            onFeedbackSubmit={handleFeedbackSubmit}
          />
        )}
      </div>
    </div>
  );
}

export default EmergencyTransportModal;