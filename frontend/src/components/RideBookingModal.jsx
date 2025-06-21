import { useState, useEffect, useRef } from 'react';
import './RideBookingModal.css';

function CommunityTransportModal({ 
  isVisible, 
  onClose, 
  destination,
  userLocation
}) {
  const [selectedOption, setSelectedOption] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const modalRef = useRef(null);

  // Community transport options (simulate API response)
  const [transportOptions, setTransportOptions] = useState([]);

  useEffect(() => {
    if (isVisible) {
      // Simulate loading community transport options
      setIsLoading(true);
      setTimeout(() => {
        setTransportOptions([
          {
            category: 'public',
            name: 'Public Transport',
            icon: '🚌',
            options: [
              { 
                type: 'Bus Route 42', 
                cost: '₹10', 
                time: '12 min', 
                details: 'Via Main St', 
                icon: '🚌',
                carbon: '0.2kg CO₂',
                crowding: 'Low'
              },
              { 
                type: 'Metro Line 2', 
                cost: '₹15', 
                time: '8 min', 
                details: 'Direct route', 
                icon: '🚇',
                carbon: '0.1kg CO₂',
                crowding: 'Medium'
              },
              { 
                type: 'Local Train', 
                cost: '₹8', 
                time: '15 min', 
                details: '2 stops', 
                icon: '🚂',
                carbon: '0.15kg CO₂',
                crowding: 'High'
              }
            ]
          },
          {
            category: 'community',
            name: 'Community Rides',
            icon: '🤝',
            options: [
              { 
                type: 'Share Auto-rickshaw', 
                cost: '₹25 (shared)', 
                time: '10 min', 
                details: '2/3 seats filled', 
                icon: '🛺',
                carbon: '0.3kg CO₂',
                rider: 'Priya K.'
              },
              { 
                type: 'Car Pool', 
                cost: '₹30 (shared)', 
                time: '7 min', 
                details: '1/4 seats available', 
                icon: '🚗',
                carbon: '0.4kg CO₂',
                rider: 'Rahul M.'
              }
            ]
          },
          {
            category: 'active',
            name: 'Active Transport',
            icon: '🚶',
            options: [
              { 
                type: 'Walking', 
                cost: 'Free', 
                time: '25 min', 
                details: '2.1 km', 
                icon: '🚶',
                carbon: '0kg CO₂',
                health: '+50 cal'
              },
              { 
                type: 'Bike Share', 
                cost: '₹5', 
                time: '12 min', 
                details: '3 bikes nearby', 
                icon: '🚲',
                carbon: '0kg CO₂',
                health: '+30 cal'
              }
            ]
          }
        ]);
        setIsLoading(false);
      }, 1500);
    }
  }, [isVisible]);

  // Close modal on ESC key
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape' && isVisible) {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener('keydown', handleEscKey);
      return () => document.removeEventListener('keydown', handleEscKey);
    }
  }, [isVisible, onClose]);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isVisible, onClose]);

  const handleOptionSelect = (option) => {
    setSelectedOption(option);
  };

  const handleSelectTransport = () => {
    if (selectedOption) {
      const message = selectedOption.rider 
        ? `Joining ${selectedOption.type} with ${selectedOption.rider}!\nCost: ${selectedOption.cost}\nTime: ${selectedOption.time}`
        : `Selected ${selectedOption.type}!\nCost: ${selectedOption.cost}\nTime: ${selectedOption.time}`;
      alert(message);
      onClose();
    }
  };

  const formatLocation = (location) => {
    if (!location) return "Unknown location";
    if (location.name) return location.name;
    return `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;
  };

  if (!isVisible) return null;

  return (
    <div className="ride-booking-modal-overlay">
      <div className="ride-booking-modal" ref={modalRef}>
        <div className="modal-header">
          <div className="route-info">
            <h2 className="modal-title">
              <span className="title-icon">🚌</span>
              Find Transport
            </h2>
            <div className="route-details">
              <div className="route-point">
                <span className="point-icon current">📍</span>
                <span className="point-text">{formatLocation(userLocation)}</span>
              </div>
              <div className="route-arrow">→</div>
              <div className="route-point">
                <span className="point-icon destination">🎯</span>
                <span className="point-text">{formatLocation(destination)}</span>
              </div>
            </div>
          </div>
          <button 
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <div className="modal-body">
          {isLoading ? (
            <div className="loading-section">
              <div className="loading-spinner"></div>
              <p className="loading-text">Finding sustainable transport options...</p>
            </div>
          ) : (
            <div className="providers-section">
              {transportOptions.map((category) => (
                <div key={category.category} className="provider-group">
                  <div className="provider-header">
                    <span className="provider-logo">{category.icon}</span>
                    <span className="provider-name">{category.name}</span>
                  </div>
                  <div className="rides-list">
                    {category.options.map((option, index) => (
                      <button
                        key={index}
                        className={`ride-option ${
                          selectedOption?.type === option.type ? 'selected' : ''
                        }`}
                        onClick={() => handleOptionSelect(option)}
                      >
                        <div className="ride-icon">{option.icon}</div>
                        <div className="ride-details">
                          <div className="ride-type">{option.type}</div>
                          <div className="ride-capacity">
                            {option.details}
                            {option.rider && <span className="rider-info"> • {option.rider}</span>}
                          </div>
                        </div>
                        <div className="ride-info">
                          <div className="ride-time">{option.time}</div>
                          <div className="ride-price">{option.cost}</div>
                          {option.carbon && (
                            <div className="carbon-info">🌱 {option.carbon}</div>
                          )}
                          {option.health && (
                            <div className="health-info">💪 {option.health}</div>
                          )}
                          {option.crowding && (
                            <div className="crowding-info">
                              👥 {option.crowding}
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {!isLoading && (
          <div className="modal-footer">
            <div className="selection-summary">
              {selectedOption ? (
                <div className="selected-ride">
                  <span className="summary-icon">{selectedOption.icon}</span>
                  <div className="summary-details">
                    <span className="summary-type">{selectedOption.type}</span>
                    <span className="summary-provider">
                      {selectedOption.rider 
                        ? `with ${selectedOption.rider}` 
                        : selectedOption.details
                      }
                    </span>
                  </div>
                  <div className="summary-info">
                    <span className="summary-price">{selectedOption.cost}</span>
                    <span className="summary-time">{selectedOption.time}</span>
                    {selectedOption.carbon && (
                      <span className="summary-carbon">🌱 {selectedOption.carbon}</span>
                    )}
                  </div>
                </div>
              ) : (
                <p className="selection-prompt">Select a transport option to continue</p>
              )}
            </div>
            <div className="action-buttons">
              <button 
                className="cancel-btn"
                onClick={onClose}
              >
                Cancel
              </button>
              <button 
                className="book-btn"
                onClick={handleSelectTransport}
                disabled={!selectedOption}
              >
                <span className="btn-icon">
                  {selectedOption?.rider ? '🤝' : '🚌'}
                </span>
                {selectedOption?.rider ? 'Join Ride' : 'Select Transport'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CommunityTransportModal;