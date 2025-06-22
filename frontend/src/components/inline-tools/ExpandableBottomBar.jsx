import { useState, useRef, useEffect } from 'react';
import AddressInput from '../AddressInput';
import './ExpandableBottomBar.css';

function ExpandableBottomBar({ userLocation, onClose }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [busNumber, setBusNumber] = useState('');
  const [currentLocation, setCurrentLocation] = useState(userLocation);
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [rewardCredits, setRewardCredits] = useState(7);
  const fileInputRef = useRef(null);

  // Calculate rewards
  useEffect(() => {
    let credits = 7; // Base credits
    if (currentLocation?.source === 'gps') credits = 10;
    else if (currentLocation?.source === 'search') credits = 9;
    if (photo) credits += 3;
    if (busNumber.trim().length > 0) credits += 2;
    setRewardCredits(credits);
  }, [currentLocation, photo, busNumber]);

  const handleLocationChange = (location) => {
    setCurrentLocation(location);
  };

  const handleMapPinRequest = () => {
    // Trigger map pinning mode
    window.dispatchEvent(new CustomEvent('requestMapPinning', {
      detail: {
        purpose: 'spot-transport-bottom-bar',
        callback: (location) => {
          setCurrentLocation({
            ...location,
            source: 'map-pin'
          });
        }
      }
    }));
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

    setIsSubmitting(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('bus_number', busNumber);
      formData.append('location_method', currentLocation?.source || 'none');
      formData.append('user_id', localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).id : 'anonymous');
      
      if (currentLocation) {
        formData.append('latitude', currentLocation.lat);
        formData.append('longitude', currentLocation.lng);
        formData.append('location_source', currentLocation.source || 'unknown');
      }
      
      if (photo) {
        formData.append('photo', photo);
      }

      const response = await fetch('/api/reports/bus-spot', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        // Show success and reset
        setBusNumber('');
        setPhoto(null);
        setPhotoPreview(null);
        setIsExpanded(false);
        // Could show a toast notification here
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to submit report');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }

    setIsSubmitting(false);
  };

  return (
    <div className={`expandable-bottom-bar ${isExpanded ? 'expanded' : 'collapsed'}`}>
      {/* Collapsed View - Quick Access */}
      {!isExpanded && (
        <div className="bottom-bar-collapsed" onClick={() => setIsExpanded(true)}>
          <div className="quick-action-hint">
            <span className="quick-icon">🚌</span>
            <span className="quick-text">Spot a Bus</span>
            <span className="quick-arrow">↑</span>
          </div>
        </div>
      )}

      {/* Expanded View - Full Form */}
      {isExpanded && (
        <div className="bottom-bar-expanded">
          <div className="bottom-bar-header">
            <h3>🚌 Quick Bus Report</h3>
            <button 
              className="collapse-btn"
              onClick={() => setIsExpanded(false)}
            >
              ↓
            </button>
          </div>

          <form onSubmit={handleSubmit} className="bottom-bar-form">
            {/* Bus Number Input */}
            <div className="form-row">
              <input
                type="text"
                value={busNumber}
                onChange={(e) => setBusNumber(e.target.value)}
                placeholder="Bus number (e.g., 102, 156K)"
                className="bus-input"
                autoFocus
              />
            </div>

            {/* Location Row */}
            <div className="form-row">
              <AddressInput
                label=""
                placeholder="Where did you spot it?"
                onLocationChange={handleLocationChange}
                onMapPinRequest={handleMapPinRequest}
                initialLocation={currentLocation}
                context="bottom-bar"
                enableGPS={true}
                enableSearch={true}
                enableMapPinning={true}
                enableCoordinates={false}
                compact={true}
              />
            </div>

            {/* Action Row */}
            <div className="form-row actions-row">
              <button
                type="button"
                className="photo-btn"
                onClick={() => fileInputRef.current?.click()}
              >
                📸 {photo ? '✓' : 'Photo'}
              </button>
              
              <div className="reward-display">
                +{rewardCredits} credits
              </div>
              
              <button
                type="submit"
                className="submit-btn"
                disabled={isSubmitting || !busNumber.trim()}
              >
                {isSubmitting ? '...' : 'Report'}
              </button>
            </div>

            {photoPreview && (
              <div className="photo-preview-row">
                <img src={photoPreview} alt="Bus photo" className="photo-thumbnail" />
                <button 
                  type="button"
                  onClick={() => {
                    setPhoto(null);
                    setPhotoPreview(null);
                    fileInputRef.current.value = '';
                  }}
                  className="remove-photo-btn"
                >
                  ×
                </button>
              </div>
            )}

            {error && (
              <div className="error-row">
                {error}
              </div>
            )}
          </form>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhotoCapture}
            style={{ display: 'none' }}
          />
        </div>
      )}
    </div>
  );
}

export default ExpandableBottomBar;