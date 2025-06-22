import { useState, useEffect, useRef } from 'react';
import AddressInput from '../AddressInput';
import './SpotTransportModal.css';

function SpotTransportModal({ onClose, userLocation, persistentData, onDataChange }) {
  const [busNumber, setBusNumber] = useState(persistentData?.busNumber || '');
  const [additionalInfo, setAdditionalInfo] = useState(persistentData?.additionalInfo || '');
  const [photo, setPhoto] = useState(persistentData?.photo || null);
  const [photoPreview, setPhotoPreview] = useState(persistentData?.photoPreview || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');
  const [rewardCredits, setRewardCredits] = useState(0);
  const [currentLocation, setCurrentLocation] = useState(persistentData?.currentLocation || userLocation);
  const fileInputRef = useRef(null);

  // Smart context hints based on time and user patterns
  const getContextHint = () => {
    const now = new Date();
    const hour = now.getHours();
    const isWeekday = now.getDay() >= 1 && now.getDay() <= 5;
    
    if (hour >= 7 && hour <= 10 && isWeekday) {
      return {
        icon: '📸',
        text: 'Morning rush - Snap photo first before bus moves away!'
      };
    } else if (hour >= 17 && hour <= 20 && isWeekday) {
      return {
        icon: '⚡', 
        text: 'Evening rush - Quick photo capture: buses move fast!'
      };
    } else if (!isWeekday) {
      return {
        icon: '📷',
        text: 'Weekend spotting - Photo helps identify bus for tourists!'
      };
    }
    
    return {
      icon: '📸',
      text: 'Photo first! Capture bus details before it moves away.'
    };
  };

  // Handle location change from AddressInput component
  const handleLocationChange = (location) => {
    setCurrentLocation(location);
    console.log('📍 Location updated:', location);
  };

  // Handle map pinning request
  const handleMapPinRequest = () => {
    // Save current state before closing modal
    if (onDataChange) {
      onDataChange({
        busNumber,
        additionalInfo,
        photo,
        photoPreview,
        currentLocation
      });
    }
    
    // Close the modal temporarily to allow map interaction
    onClose();
    
    // Trigger map pinning mode via window event
    window.dispatchEvent(new CustomEvent('requestMapPinning', {
      detail: {
        purpose: 'spot-transport',
        callback: (location) => {
          // Update location in persistent data and reopen modal
          const newLocation = {
            ...location,
            source: 'map-pin'
          };
          
          if (onDataChange) {
            onDataChange({
              busNumber,
              additionalInfo,
              photo,
              photoPreview,
              currentLocation: newLocation
            });
          }
          
          console.log('📍 Map pin selected:', location);
          
          // Reopen the modal with preserved data
          window.dispatchEvent(new CustomEvent('reopenSpotTransport'));
        }
      }
    }));
  };

  // ESC key handling - Human UX compliant
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [onClose]);

  // Simple reward calculation
  useEffect(() => {
    let credits = 7; // Base credits
    if (currentLocation?.source === 'gps') credits = 10; // GPS gets bonus
    else if (currentLocation?.source === 'search') credits = 9; // Search gets good bonus
    else if (currentLocation?.source === 'manual') credits = 8; // Manual coordinates get decent bonus
    if (photo) credits += 3; // Photo bonus
    if (busNumber.trim().length > 0) credits += 2; // Completion bonus
    setRewardCredits(credits);
  }, [currentLocation, photo, busNumber]);


  const handlePhotoCapture = (event) => {
    const file = event.target.files[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onload = (e) => setPhotoPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' = back, 'user' = front
  const videoRef = useRef(null);

  // Persist data whenever state changes
  useEffect(() => {
    if (onDataChange) {
      onDataChange({
        busNumber,
        additionalInfo,
        photo,
        photoPreview,
        currentLocation
      });
    }
  }, [busNumber, additionalInfo, photo, photoPreview, currentLocation, onDataChange]);

  // Open camera with current facing mode
  const handleCameraCapture = async () => {
    try {
      await startCameraStream(facingMode);
    } catch (error) {
      console.error('Camera access denied or failed:', error);
      // Fallback to file input
      fileInputRef.current?.click();
    }
  };

  // Start camera stream with specified facing mode
  const startCameraStream = async (mode) => {
    // Stop existing stream if any
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
    }

    // Request camera permission and stream
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { 
        facingMode: mode // 'environment' = back, 'user' = front
      } 
    });
    
    setCameraStream(stream);
    setShowCamera(true);
    
    // Wait for video element to be ready
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    }, 100);
  };

  // Switch between front and back camera
  const switchCamera = async () => {
    const newFacingMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newFacingMode);
    
    try {
      await startCameraStream(newFacingMode);
    } catch (error) {
      console.error('Failed to switch camera:', error);
      // Revert to previous facing mode if switch fails
      setFacingMode(facingMode);
    }
  };

  // Capture photo with timestamp and location overlay
  const capturePhoto = async () => {
    if (!videoRef.current || !cameraStream) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw current video frame to canvas
    context.drawImage(video, 0, 0);
    
    // Get current location for overlay
    let locationText = 'Location detecting...';
    try {
      if (currentLocation && currentLocation.lat && currentLocation.lng) {
        // Use existing location
        locationText = currentLocation.name || currentLocation.display_name || 
                      `${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}`;
      } else {
        // Try to get current location
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 3000,
            maximumAge: 30000
          });
        });
        locationText = `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`;
      }
    } catch (error) {
      locationText = 'Location unavailable';
    }
    
    // Add timestamp and location overlay
    addPhotoOverlay(context, canvas.width, canvas.height, locationText);
    
    // Convert to blob and create file
    canvas.toBlob((blob) => {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const file = new File([blob], `bus-spot-${timestamp}.jpg`, { type: 'image/jpeg' });
      setPhoto(file);
      setPhotoPreview(canvas.toDataURL());
      
      // Close camera
      closeCameraFeed();
    }, 'image/jpeg', 0.9);
  };

  // Add timestamp and location overlay to photo
  const addPhotoOverlay = (context, width, height, locationText) => {
    const now = new Date();
    const timestamp = now.toLocaleString('en-IN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'Asia/Kolkata'
    });
    
    // Overlay background
    const overlayHeight = Math.max(60, height * 0.08);
    context.fillStyle = 'rgba(0, 0, 0, 0.7)';
    context.fillRect(0, height - overlayHeight, width, overlayHeight);
    
    // Text styling
    const fontSize = Math.max(12, Math.min(width * 0.025, 16));
    context.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    context.fillStyle = '#FFFFFF';
    context.textAlign = 'left';
    
    // Timestamp
    const timeY = height - overlayHeight + fontSize + 8;
    context.fillText(`🕐 ${timestamp}`, 12, timeY);
    
    // Location
    const locationY = timeY + fontSize + 4;
    context.font = `${fontSize * 0.85}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    context.fillStyle = '#E3F2FD';
    
    // Truncate location if too long
    const maxLocationLength = Math.floor(width / (fontSize * 0.6));
    const truncatedLocation = locationText.length > maxLocationLength 
      ? locationText.substring(0, maxLocationLength - 3) + '...'
      : locationText;
    
    context.fillText(`📍 ${truncatedLocation}`, 12, locationY);
    
    // Add app branding (small)
    context.font = `${fontSize * 0.7}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    context.fillStyle = 'rgba(255, 255, 255, 0.6)';
    context.textAlign = 'right';
    context.fillText('🚌 Spot Transport', width - 12, height - 8);
  };

  // Close camera feed
  const closeCameraFeed = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!busNumber.trim()) {
      setError('Please enter a bus number');
      return;
    }
    
    // No validation needed - AddressInput handles location validation

    setIsSubmitting(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('bus_number', busNumber);
      formData.append('additional_info', additionalInfo);
      formData.append('location_method', currentLocation?.source || 'none');
      formData.append('user_id', localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).id : 'anonymous');
      
      // Location data - backend expects 'location' object
      if (currentLocation) {
        const locationData = {
          lat: currentLocation.lat,
          lng: currentLocation.lng
        };
        formData.append('location', JSON.stringify(locationData));
        
        // Set confidence based on location source and accuracy
        if (currentLocation.source === 'gps') {
          formData.append('confidence', currentLocation.accuracy < 50 ? 'high' : 'medium');
        } else if (currentLocation.source === 'search') {
          formData.append('confidence', 'high');
        } else if (currentLocation.source === 'manual' || currentLocation.source === 'map-pin') {
          formData.append('confidence', 'medium');
        } else {
          formData.append('confidence', 'low');
        }
      } else {
        // No specific location provided
        formData.append('location', JSON.stringify({ lat: null, lng: null }));
        formData.append('confidence', 'low');
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
        
        // Clear persistent data on successful submission
        if (onDataChange) {
          onDataChange({
            photo: null,
            photoPreview: null,
            busNumber: '',
            additionalInfo: '',
            currentLocation: null
          });
        }
        
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
      <div className="spot-transport-overlay">
        <div className="spot-transport-modal">
          <div className="success-content">
            <div className="success-animation">🎉</div>
            <h2>Bus Spotted!</h2>
            <p>Thank you for helping the community</p>
            <div className="success-rewards">
              <span className="success-reward-item">+{rewardCredits} Credits</span>
              {currentLocation?.source === 'gps' && <span className="success-reward-item">GPS Verified</span>}
              {currentLocation?.source === 'search' && <span className="success-reward-item">Location Verified</span>}
              {currentLocation?.source === 'manual' && <span className="success-reward-item">Coordinates Verified</span>}
              {photo && <span className="success-reward-item">Photo Bonus</span>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const contextHint = getContextHint();

  return (
    <div className="spot-transport-overlay">
      <div className="spot-transport-modal">
        <div className="spot-modal-header">
          <h2>🚌 Spot Transport</h2>
          <p>Quick bus reporting for community rewards</p>
          <button className="spot-close-btn" onClick={onClose}>×</button>
        </div>

        <div className="spot-modal-content">
          {/* Context Hint */}
          <div className="context-hint">
            <span className="context-hint-icon">{contextHint.icon}</span>
            {contextHint.text}
          </div>

          <form onSubmit={handleSubmit} className="quick-report-form">
            {/* Photo Section - Priority #1 - Capture before bus moves! */}
            <div className="photo-section priority-section">
              <h3>📸 Quick Photo (Recommended)</h3>
              <div className="photo-priority-hint">
                <span className="priority-icon">⚡</span>
                <span className="priority-text">Photo helps verify your report, but you can skip if needed</span>
              </div>
              
              {/* Camera Feed */}
              {showCamera && (
                <div className="camera-container">
                  {/* Clean Camera Feed - No overlays */}
                  <div className="camera-feed">
                    <video 
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="camera-video"
                    />
                  </div>
                  
                  {/* All Camera Controls - Outside Camera Window */}
                  <div className="external-camera-controls">
                    <button
                      type="button"
                      className="external-control-btn switch-btn"
                      onClick={switchCamera}
                      title={facingMode === 'environment' ? 'Switch to front camera' : 'Switch to back camera'}
                    >
                      🔄 {facingMode === 'environment' ? 'Front' : 'Back'}
                    </button>
                    
                    <button
                      type="button"
                      className="external-control-btn capture-btn-external"
                      onClick={capturePhoto}
                    >
                      📸 Capture
                    </button>
                    
                    <button
                      type="button"
                      className="external-control-btn close-btn"
                      onClick={closeCameraFeed}
                      title="Close Camera"
                    >
                      ✕ Close
                    </button>
                  </div>
                </div>
              )}
              
              {/* Photo Preview */}
              {photoPreview && !showCamera && (
                <div className="photo-preview">
                  <img src={photoPreview} alt="Bus photo" />
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
              )}
              
              {/* Photo Capture Options */}
              {!photoPreview && !showCamera && (
                <div className="photo-capture-options">
                  <button
                    type="button"
                    className="photo-capture-btn priority-photo-btn camera-btn"
                    onClick={handleCameraCapture}
                    autoFocus={true}
                  >
                    📸 Open Camera
                  </button>
                  <button
                    type="button"
                    className="photo-capture-btn file-btn"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    📁 Choose File
                  </button>
                  <button
                    type="button"
                    className="photo-capture-btn skip-photo-btn-override"
                    onClick={() => {
                      // Skip photo and focus on bus number input
                      const busInput = document.getElementById('busNumber');
                      if (busInput) {
                        busInput.focus();
                      }
                      console.log('🔍 SKIP PHOTO button clicked successfully!');
                    }}
                    style={{
                      background: '#FF9800',
                      color: '#000000',
                      border: '3px solid #9C27B0',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'block',
                      width: '100%',
                      marginTop: '8px',
                      zIndex: '9999',
                      position: 'relative'
                    }}
                  >
                    ⏭️ SKIP PHOTO (TEST VISIBLE)
                  </button>
                </div>
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

            {/* Bus Number - Secondary Priority */}
            <div className="bus-input-group">
              <label htmlFor="busNumber">Bus number (check photo if needed)</label>
              <input
                id="busNumber"
                type="text"
                value={busNumber}
                onChange={(e) => setBusNumber(e.target.value)}
                placeholder="e.g., 102, 156K, Blue Line"
                className="bus-number-input"
                autoFocus={photo ? true : false}
              />
              {photo && (
                <div className="photo-reference-hint">
                  💡 Check your photo above if bus number isn't clear
                </div>
              )}
            </div>

            {/* Location Input - Final Priority */}
            <AddressInput
              label="📍 Where was this photo taken?"
              placeholder="Location where you spotted the bus..."
              onLocationChange={handleLocationChange}
              onMapPinRequest={handleMapPinRequest}
              initialLocation={currentLocation}
              context="spot-transport"
              enableGPS={true}
              enableSearch={true}
              enableMapPinning={true}
              enableCoordinates={false}
              showRewards={true}
              contextHint="📍 GPS location automatically saved with photo timestamp"
              autoFocus={false}
            />

            {/* Additional Info - Optional */}
            <div className="additional-info">
              <label htmlFor="additionalInfo">Additional Details (Optional)</label>
              <textarea
                id="additionalInfo"
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                placeholder="Bus condition, crowding, route info..."
                rows="2"
              />
            </div>

            {/* Reward Preview */}
            <div className="reward-preview">
              <div className="reward-text">+{rewardCredits} Credits Earned</div>
              <div className="reward-details">
                {currentLocation?.source === 'gps' ? 'GPS Verified' : 
                 currentLocation?.source === 'search' ? 'Location Verified' :
                 currentLocation?.source === 'manual' ? 'Coordinates Verified' :
                 'Community Verified'} • Quick Report
              </div>
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="submit-btn"
              disabled={isSubmitting || !busNumber.trim()}
            >
              {isSubmitting ? (
                <>
                  <span className="loading-spinner"></span>
                  Reporting Bus...
                </>
              ) : (
                '🚌 Report Bus Spot'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default SpotTransportModal;