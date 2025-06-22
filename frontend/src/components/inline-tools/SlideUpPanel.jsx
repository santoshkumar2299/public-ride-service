import { useState, useRef, useEffect } from 'react';
import AddressInput from '../AddressInput';
import './SlideUpPanel.css';

function SlideUpPanel({ userLocation, onClose, isVisible }) {
  const [busNumber, setBusNumber] = useState('');
  const [currentLocation, setCurrentLocation] = useState(userLocation);
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [rewardCredits, setRewardCredits] = useState(7);
  const [dragStartY, setDragStartY] = useState(null);
  const [dragCurrentY, setDragCurrentY] = useState(0);
  const fileInputRef = useRef(null);
  const panelRef = useRef(null);

  // Calculate rewards
  useEffect(() => {
    let credits = 7; // Base credits
    if (currentLocation?.source === 'gps') credits = 10;
    else if (currentLocation?.source === 'search') credits = 9;
    if (photo) credits += 3;
    if (busNumber.trim().length > 0) credits += 2;
    if (additionalInfo.trim().length > 0) credits += 1;
    setRewardCredits(credits);
  }, [currentLocation, photo, busNumber, additionalInfo]);

  const handleLocationChange = (location) => {
    setCurrentLocation(location);
  };

  const handleMapPinRequest = () => {
    // Trigger map pinning mode
    window.dispatchEvent(new CustomEvent('requestMapPinning', {
      detail: {
        purpose: 'spot-transport-slide-panel',
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
      formData.append('additional_info', additionalInfo);
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
        setAdditionalInfo('');
        setPhoto(null);
        setPhotoPreview(null);
        if (onClose) onClose();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to submit report');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }

    setIsSubmitting(false);
  };

  // Handle drag to dismiss (iOS style)
  const handleTouchStart = (e) => {
    setDragStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e) => {
    if (dragStartY === null) return;
    
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - dragStartY;
    
    // Only allow downward drags
    if (deltaY > 0) {
      setDragCurrentY(deltaY);
    }
  };

  const handleTouchEnd = () => {
    if (dragCurrentY > 100) { // Threshold to dismiss
      onClose();
    }
    setDragStartY(null);
    setDragCurrentY(0);
  };

  if (!isVisible) return null;

  return (
    <div className="slide-up-overlay">
      <div 
        className="slide-up-panel"
        ref={panelRef}
        style={{
          transform: `translateY(${dragCurrentY}px)`,
          opacity: 1 - (dragCurrentY / 300)
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag Handle */}
        <div className="drag-handle">
          <div className="drag-indicator"></div>
        </div>

        {/* Panel Header */}
        <div className="panel-header">
          <h2>🚌 Report Bus Spot</h2>
          <p>Help your community with real-time bus updates</p>
          <button className="panel-close" onClick={onClose}>×</button>
        </div>

        {/* Panel Content */}
        <div className="panel-content">
          <form onSubmit={handleSubmit} className="panel-form">
            {/* Bus Number - Primary Input */}
            <div className="form-section">
              <label className="section-label">Which bus did you spot?</label>
              <input
                type="text"
                value={busNumber}
                onChange={(e) => setBusNumber(e.target.value)}
                placeholder="e.g., 102, 156K, Blue Line"
                className="primary-input"
                autoFocus
              />
            </div>

            {/* Location Section */}
            <div className="form-section">
              <label className="section-label">📍 Where did you spot it?</label>
              <AddressInput
                label=""
                placeholder="Bus stop, landmark, or address..."
                onLocationChange={handleLocationChange}
                onMapPinRequest={handleMapPinRequest}
                initialLocation={currentLocation}
                context="slide-panel"
                enableGPS={true}
                enableSearch={true}
                enableMapPinning={true}
                enableCoordinates={false}
                compact={false}
              />
            </div>

            {/* Photo Section */}
            <div className="form-section">
              <label className="section-label">📸 Add Photo (Optional)</label>
              {photoPreview ? (
                <div className="photo-preview-container">
                  <img src={photoPreview} alt="Bus photo" className="photo-preview" />
                  <div className="photo-actions">
                    <button 
                      type="button"
                      className="retake-btn"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      📸 Retake
                    </button>
                    <button 
                      type="button"
                      className="remove-btn"
                      onClick={() => {
                        setPhoto(null);
                        setPhotoPreview(null);
                        fileInputRef.current.value = '';
                      }}
                    >
                      🗑️ Remove
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="photo-capture-button"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="capture-icon">📸</div>
                  <div className="capture-text">
                    <div className="capture-title">Take Photo</div>
                    <div className="capture-subtitle">+3 bonus credits</div>
                  </div>
                </button>
              )}
            </div>

            {/* Additional Info Section */}
            <div className="form-section">
              <label className="section-label">💬 Additional Details (Optional)</label>
              <textarea
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                placeholder="Bus condition, crowding level, route info, delays..."
                rows="3"
                className="details-input"
              />
            </div>

            {/* Reward Preview */}
            <div className="reward-section">
              <div className="reward-card">
                <div className="reward-amount">+{rewardCredits} Credits</div>
                <div className="reward-breakdown">
                  <span className="reward-item">Base Report: +7</span>
                  {currentLocation?.source === 'gps' && <span className="reward-item">GPS Bonus: +3</span>}
                  {currentLocation?.source === 'search' && <span className="reward-item">Location Bonus: +2</span>}
                  {photo && <span className="reward-item">Photo Bonus: +3</span>}
                  {busNumber.trim() && <span className="reward-item">Complete Info: +2</span>}
                  {additionalInfo.trim() && <span className="reward-item">Extra Details: +1</span>}
                </div>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="error-section">
                <div className="error-message">{error}</div>
              </div>
            )}

            {/* Submit Button */}
            <div className="submit-section">
              <button
                type="submit"
                className="submit-button"
                disabled={isSubmitting || !busNumber.trim()}
              >
                {isSubmitting ? (
                  <>
                    <span className="loading-spinner"></span>
                    Reporting Bus...
                  </>
                ) : (
                  <>
                    🚌 Report Bus Spot
                    <span className="submit-credits">+{rewardCredits}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handlePhotoCapture}
          style={{ display: 'none' }}
        />
      </div>
    </div>
  );
}

export default SlideUpPanel;