import { useState, useEffect, useRef } from 'react';
import MapView from '../MapView';

function SpotTransportModal({ onClose, userLocation }) {
  const [busNumber, setBusNumber] = useState('');
  const [confidence, setConfidence] = useState('medium');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');
  const [locationMethod, setLocationMethod] = useState(userLocation ? 'auto' : 'map');
  const [manualAddress, setManualAddress] = useState('');
  const [mapLocation, setMapLocation] = useState(null);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [rewardCredits, setRewardCredits] = useState(0);
  const fileInputRef = useRef(null);

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

  // Calculate reward credits based on location method and other factors
  useEffect(() => {
    let baseCredits = 5; // Base credits for manual location
    
    if (locationMethod === 'auto' && userLocation) {
      baseCredits = 10; // Higher credits for GPS location
    } else if (locationMethod === 'map' && mapLocation) {
      baseCredits = 8; // Medium-high credits for map selection
    }
    
    if (photo) {
      baseCredits += 5; // Photo bonus
    }
    
    // Confidence bonus
    if (confidence === 'high') {
      baseCredits += 2;
    } else if (confidence === 'medium') {
      baseCredits += 1;
    }
    
    setRewardCredits(baseCredits);
  }, [locationMethod, userLocation, mapLocation, photo, confidence]);

  const handleLocationMethodChange = (method) => {
    setLocationMethod(method);
    if (method === 'auto' && !userLocation) {
      // Try to get location if switching to auto mode
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            // Location will be handled by parent component
            setError('');
          },
          (error) => {
            setError('Could not get your location. Please use map or manual entry.');
            setLocationMethod('map');
          }
        );
      } else {
        setError('Location not supported. Please use map or manual entry.');
        setLocationMethod('map');
      }
    } else if (method === 'map') {
      setShowMapPicker(true);
    }
  };

  const handleMapLocationSelect = (location) => {
    setMapLocation(location);
    setShowMapPicker(false);
    setError('');
  };

  const handlePhotoCapture = (event) => {
    const file = event.target.files[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onload = (e) => setPhotoPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!busNumber.trim()) {
      setError('Please enter a bus number');
      return;
    }
    
    // Validate location based on method
    if (locationMethod === 'auto' && !userLocation) {
      setError('GPS location not available. Please switch to map or manual entry.');
      return;
    }
    
    if (locationMethod === 'map' && !mapLocation) {
      setError('Please select a location on the map');
      return;
    }
    
    if (locationMethod === 'manual' && !manualAddress.trim()) {
      setError('Please enter the location address');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('bus_number', busNumber);
      formData.append('confidence_level', confidence);
      formData.append('additional_info', additionalInfo);
      formData.append('location_method', locationMethod);
      formData.append('user_id', localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).id : 'anonymous');
      
      // Location data based on method
      if (locationMethod === 'auto' && userLocation) {
        formData.append('latitude', userLocation.lat);
        formData.append('longitude', userLocation.lng);
        formData.append('location_accuracy', 'high');
      } else if (locationMethod === 'map' && mapLocation) {
        formData.append('latitude', mapLocation.lat);
        formData.append('longitude', mapLocation.lng);
        formData.append('location_accuracy', 'medium');
      } else if (locationMethod === 'manual') {
        formData.append('manual_address', manualAddress);
        formData.append('location_accuracy', 'low');
        // Set coordinates to null for manual entries - backend will geocode if needed
        formData.append('latitude', '');
        formData.append('longitude', '');
      }
      
      if (photo) {
        formData.append('photo', photo);
      }

      const response = await fetch('/api/reports/bus-spot', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        setShowSuccess(true);
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to submit report');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }

    setIsSubmitting(false);
  };

  if (showSuccess) {
    return (
      <div className="modal-overlay">
        <div className="modal">
          <div className="modal-content success-content">
            <div className="success-animation">🎉</div>
            <h2>Spot Reported!</h2>
            <p>Thank you for helping the community</p>
            <div className="rewards-earned">
              <span className="reward-item">+{rewardCredits} Credits</span>
              {locationMethod === 'auto' && <span className="reward-item">GPS Verified</span>}
              {photo && <span className="reward-item">Photo Bonus</span>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <div className="modal-icon">📍</div>
          <h2>Spot Transport</h2>
          <p>Report bus locations for community rewards</p>
          <div className="header-actions">
            <button className="home-btn" onClick={onClose} title="Back to map">
              🏠 Home
            </button>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        <div className="modal-content">
          <form onSubmit={handleSubmit} className="spot-form">
            <div className="form-group">
              <label htmlFor="busNumber">Bus Number *</label>
              <input
                id="busNumber"
                type="text"
                value={busNumber}
                onChange={(e) => setBusNumber(e.target.value)}
                placeholder="e.g., 102, 156K, Blue Line"
                className="form-input"
                autoFocus
              />
            </div>

            <div className="form-group">
              <label>Location Method</label>
              <div className="location-method-selector">
                <button
                  type="button"
                  className={`location-method-btn ${locationMethod === 'auto' ? 'active' : ''}`}
                  onClick={() => handleLocationMethodChange('auto')}
                  disabled={!userLocation}
                >
                  <span className="method-icon">📍</span>
                  <div className="method-info">
                    <span className="method-title">Use GPS Location</span>
                    <span className="method-subtitle">+{userLocation ? '10' : '0'} credits • More accurate</span>
                  </div>
                </button>
                
                <button
                  type="button"
                  className={`location-method-btn ${locationMethod === 'map' ? 'active' : ''}`}
                  onClick={() => handleLocationMethodChange('map')}
                >
                  <span className="method-icon">🗺️</span>
                  <div className="method-info">
                    <span className="method-title">Pick on Map</span>
                    <span className="method-subtitle">+8 credits • Visual accuracy</span>
                  </div>
                </button>
                
                <button
                  type="button"
                  className={`location-method-btn ${locationMethod === 'manual' ? 'active' : ''}`}
                  onClick={() => handleLocationMethodChange('manual')}
                >
                  <span className="method-icon">✍️</span>
                  <div className="method-info">
                    <span className="method-title">Enter Address</span>
                    <span className="method-subtitle">+5 credits • Community verified</span>
                  </div>
                </button>
              </div>
            </div>

            {locationMethod === 'manual' && (
              <div className="form-group">
                <label htmlFor="manualAddress">Location Address *</label>
                <input
                  id="manualAddress"
                  type="text"
                  value={manualAddress}
                  onChange={(e) => setManualAddress(e.target.value)}
                  placeholder="e.g., Near Apollo Hospital, Jubilee Hills"
                  className="form-input"
                />
                <div className="location-help">
                  💡 Be as specific as possible. Other users will verify your report.
                </div>
              </div>
            )}

            {locationMethod === 'map' && (
              <div className="form-group">
                <label>Map Location</label>
                {mapLocation ? (
                  <div className="map-location-preview">
                    <div className="location-coords">
                      📍 Selected: {mapLocation.lat.toFixed(4)}, {mapLocation.lng.toFixed(4)}
                    </div>
                    <button 
                      type="button" 
                      className="change-map-location"
                      onClick={() => setShowMapPicker(true)}
                    >
                      📍 Change Location
                    </button>
                  </div>
                ) : (
                  <button 
                    type="button" 
                    className="select-map-location"
                    onClick={() => setShowMapPicker(true)}
                  >
                    🗺️ Select Location on Map
                  </button>
                )}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="confidence">How sure are you?</label>
              <select
                id="confidence"
                value={confidence}
                onChange={(e) => setConfidence(e.target.value)}
                className="form-select"
              >
                <option value="low">🤔 Not very sure</option>
                <option value="medium">😐 Pretty sure</option>
                <option value="high">😎 Absolutely certain</option>
              </select>
            </div>

            <div className="form-group">
              <label>Add Photo (Optional) +5 bonus credits</label>
              <div className="photo-section">
                {photoPreview ? (
                  <div className="photo-preview">
                    <img src={photoPreview} alt="Bus photo preview" />
                    <button 
                      type="button" 
                      className="remove-photo"
                      onClick={() => {
                        setPhoto(null);
                        setPhotoPreview(null);
                        fileInputRef.current.value = '';
                      }}
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="photo-capture-btn"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    📸 Take Photo
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoCapture}
                  className="hidden-file-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="additionalInfo">Additional Info (Optional)</label>
              <textarea
                id="additionalInfo"
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                placeholder="Route details, bus condition, passenger load, etc."
                className="form-textarea"
                rows="3"
              />
            </div>

            {error && (
              <div className="error-message">
                ⚠️ {error}
              </div>
            )}

            <div className="location-info">
              {locationMethod === 'auto' ? (
                userLocation ? 
                  `📍 GPS: ${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}` : 
                  '📍 GPS: Detecting...'
              ) : locationMethod === 'map' ? (
                mapLocation ? 
                  `🗺️ Map: ${mapLocation.lat.toFixed(4)}, ${mapLocation.lng.toFixed(4)}` : 
                  '🗺️ Map: Select location above'
              ) : (
                `📍 Manual: ${manualAddress || 'Enter address above'}`
              )}
            </div>

            <div className="rewards-preview">
              <span className="reward-text">Rewards: +{rewardCredits} credits</span>
              {locationMethod === 'auto' && <span className="accuracy-text">High accuracy</span>}
              {locationMethod === 'map' && <span className="accuracy-text">Visual accuracy</span>}
              {locationMethod === 'manual' && <span className="community-text">Community verified</span>}
            </div>

            <button
              type="submit"
              className="submit-btn"
              disabled={isSubmitting || !busNumber.trim()}
            >
              {isSubmitting ? '📤 Submitting...' : '🎯 Submit Spot Report'}
            </button>
          </form>
        </div>
      </div>

      {/* Map Picker Modal */}
      {showMapPicker && (
        <div className="map-picker-overlay">
          <div className="map-picker-modal">
            <div className="map-picker-header">
              <h3>📍 Select Bus Location</h3>
              <p>Tap on the map where you spotted the bus</p>
              <button 
                className="close-map-picker"
                onClick={() => setShowMapPicker(false)}
              >
                ✕
              </button>
            </div>
            <div className="map-picker-content">
              <MapView
                center={userLocation ? [userLocation.lat, userLocation.lng] : [17.385044, 78.486671]}
                zoom={15}
                height="400px"
                showControls={true}
                onClick={handleMapLocationSelect}
                markers={mapLocation ? [{
                  latitude: mapLocation.lat,
                  longitude: mapLocation.lng,
                  title: "Selected Location",
                  icon: '📍',
                  color: '#e91e63'
                }] : []}
              />
            </div>
            <div className="map-picker-footer">
              {mapLocation && (
                <div className="selected-coords">
                  Selected: {mapLocation.lat.toFixed(4)}, {mapLocation.lng.toFixed(4)}
                </div>
              )}
              <div className="map-picker-actions">
                <button 
                  className="cancel-map-selection"
                  onClick={() => setShowMapPicker(false)}
                >
                  Cancel
                </button>
                {mapLocation && (
                  <button 
                    className="confirm-map-selection"
                    onClick={() => setShowMapPicker(false)}
                  >
                    Use This Location
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SpotTransportModal;