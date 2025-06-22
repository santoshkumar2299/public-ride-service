import { useState, useRef, useEffect } from 'react';
import AddressInput from '../AddressInput';
import './FloatingCard.css';

function FloatingCard({ userLocation, onClose }) {
  const [busNumber, setBusNumber] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [currentLocation, setCurrentLocation] = useState(userLocation);
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [rewardCredits, setRewardCredits] = useState(7);
  const [currentStep, setCurrentStep] = useState(1); // 1: Photo, 2: Location, 3: Bus Info, 4: Report
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [facingMode, setFacingMode] = useState('environment');
  const [isMapPinning, setIsMapPinning] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const gestureStartTime = useRef(null);

  // Simple reward calculation
  useEffect(() => {
    let credits = 5; // Base credits
    if (photo) credits += 3; // Photo bonus
    if (busNumber.trim().length > 0) credits += 2; // Bus number bonus
    if (additionalInfo.trim().length > 0) credits += 1; // Additional info bonus
    setRewardCredits(credits);
  }, [photo, busNumber, additionalInfo]);

  // Progress calculation
  const getProgress = () => {
    let completed = 0;
    if (photo) completed++;
    if (currentLocation) completed++;
    if (busNumber.trim()) completed++;
    return (completed / 3) * 100;
  };

  // Step validation - Allow skipping photo
  const canProceedToStep = (step) => {
    switch (step) {
      case 2: return true; // Location step can proceed with or without photo
      case 3: return currentLocation !== null; // Bus info needs location (photo optional)
      case 4: return currentLocation !== null && busNumber.trim() !== ''; // Report needs location + bus number (photo optional)
      default: return true;
    }
  };

  const handleLocationChange = (location) => {
    setCurrentLocation(location);
  };

  const handleMapPinRequest = () => {
    // Minimize modal and enter map pinning mode
    setIsMapPinning(true);
    
    // Trigger map pinning mode (EXACT SAME PURPOSE AS SpotTransportModal)
    window.dispatchEvent(new CustomEvent('requestMapPinning', {
      detail: {
        purpose: 'spot-transport-floating-card',
        callback: (location) => {
          setCurrentLocation({
            ...location,
            source: 'map-pin'
          });
          // Restore modal after location is pinned
          setIsMapPinning(false);
        }
      }
    }));
  };

  // Camera functionality
  const handleCameraCapture = async () => {
    try {
      await startCameraStream(facingMode);
    } catch (error) {
      console.error('Camera access denied:', error);
      fileInputRef.current?.click();
    }
  };

  const startCameraStream = async (mode) => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
    }

    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { facingMode: mode } 
    });
    
    setCameraStream(stream);
    setShowCamera(true);
    
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    }, 100);
  };

  // Switch between front and back camera (EXACT SAME AS SpotTransportModal)
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

  // Professional gesture handlers
  const handleDoubleTap = () => {
    switchCamera();
  };

  const handleViewfinderTap = (event) => {
    const now = Date.now();
    
    if (gestureStartTime.current && now - gestureStartTime.current < 300) {
      // Double tap detected
      handleDoubleTap();
      gestureStartTime.current = null;
    } else {
      // Single tap for focus (visual feedback only for now)
      gestureStartTime.current = now;
      
      // Add focus ring animation at tap location
      const rect = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      // Could add focus ring here in future
      console.log('Focus tap at:', x, y);
    }
  };

  // Capture photo with timestamp and location overlay (Enhanced with professional animations)
  const capturePhoto = async () => {
    if (!videoRef.current || !cameraStream || isCapturing) return;

    setIsCapturing(true);
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
      
      // Close camera with slight delay for professional feel
      setTimeout(() => {
        closeCameraFeed();
        setCurrentStep(2); // Auto-advance to location step
      }, 300);
    }, 'image/jpeg', 0.9);
    
    // Reset capturing state
    setTimeout(() => setIsCapturing(false), 500);
  };

  // Add timestamp and location overlay to photo (EXACT SAME AS SpotTransportModal)
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

  const closeCameraFeed = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
  };

  const handlePhotoCapture = (event) => {
    const file = event.target.files[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onload = (e) => setPhotoPreview(e.target.result);
      reader.readAsDataURL(file);
      setCurrentStep(2); // Auto-advance to location step
    }
  };

  const handleSubmit = async () => {
    if (!busNumber.trim()) {
      setError('Please enter a bus number');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // EXACT SAME BACKEND INTEGRATION AS SpotTransportModal
      const formData = new FormData();
      formData.append('bus_number', busNumber);
      formData.append('additional_info', additionalInfo);
      formData.append('location_method', currentLocation?.source || 'none');
      formData.append('user_id', localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).id : 'anonymous');
      
      // Location data - backend expects 'location' object (EXACT SAME FORMAT)
      if (currentLocation) {
        const locationData = {
          lat: currentLocation.lat,
          lng: currentLocation.lng
        };
        formData.append('location', JSON.stringify(locationData));
        
        // Set confidence based on location source and accuracy (EXACT SAME LOGIC)
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
        // No specific location provided (EXACT SAME FALLBACK)
        formData.append('location', JSON.stringify({ lat: null, lng: null }));
        formData.append('confidence', 'low');
      }
      
      if (photo) {
        formData.append('photo', photo);
      }

      // EXACT SAME ENDPOINT
      const response = await fetch('/api/reports/bus-spot', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        
        // Reset all state
        setBusNumber('');
        setAdditionalInfo('');
        setPhoto(null);
        setPhotoPreview(null);
        setCurrentLocation(userLocation);
        setCurrentStep(1);
        setIsMapPinning(false);
        
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

  // Map pinning minimized view
  if (isMapPinning) {
    return (
      <div className="map-pinning-overlay">
        <div className="map-pinning-indicator">
          <div className="pinning-content">
            <div className="pinning-icon">📍</div>
            <div className="pinning-text">
              <h4>Tap on the map to pin location</h4>
              <p>Choose the exact spot where you saw the bus</p>
            </div>
            <button 
              className="cancel-pinning-btn"
              onClick={() => setIsMapPinning(false)}
            >
              Cancel
            </button>
          </div>
          <div className="pinning-hint">
            <span className="hint-pulse">📍</span>
            <span>Tap anywhere on the map to set location</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="floating-card-overlay">
      <div className="floating-card stepped">
        {/* Simplified Header */}
        <div className="card-header">
          <div className="header-content">
            <h3>🚌 Spot Bus</h3>
            <button className="card-close" onClick={onClose}>×</button>
          </div>
        </div>

        {/* Step Content */}
        <div className="step-content">
          {/* Step 1: Photo Capture */}
          {currentStep === 1 && (
            <div className="step-section photo-step">
              <div className="step-header">
                <h4>📸 Photo</h4>
              </div>

              {/* Professional Camera Interface */}
              {showCamera && (
                <div className="camera-interface">
                  {/* Full-Screen Camera Viewfinder */}
                  <div className="camera-viewfinder" onClick={handleViewfinderTap}>
                    <video 
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="camera-video"
                    />
                    
                    {/* Professional Camera Overlay */}
                    <div className="camera-overlay">
                      {/* Top Controls Bar */}
                      <div className="camera-top-controls">
                        <button
                          type="button"
                          className="overlay-control-btn close-btn"
                          onClick={closeCameraFeed}
                          aria-label="Close camera"
                        >
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                        </button>
                        
                        <div className="camera-mode-indicator">
                          <span>PHOTO</span>
                        </div>
                        
                        <button
                          type="button"
                          className="overlay-control-btn flip-btn"
                          onClick={switchCamera}
                          aria-label={facingMode === 'environment' ? 'Switch to front camera' : 'Switch to back camera'}
                        >
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M16 4h2a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" stroke="currentColor" strokeWidth="2"/>
                            <path d="m9 7 3-3 3 3" stroke="currentColor" strokeWidth="2"/>
                          </svg>
                        </button>
                      </div>
                      
                      {/* Bottom Controls Zone */}
                      <div className="camera-bottom-controls">
                        <div className="controls-container">
                          {/* Secondary Control */}
                          <div className="secondary-control">
                            <span className="camera-hint">Tap to capture</span>
                          </div>
                          
                          {/* Primary Shutter Button */}
                          <button
                            type="button"
                            className={`shutter-button ${isCapturing ? 'capturing' : ''}`}
                            onClick={capturePhoto}
                            aria-label="Take photo"
                            disabled={isCapturing}
                          >
                            <div className={`shutter-ring ${isCapturing ? 'capturing' : ''}`}></div>
                            <div className={`shutter-inner ${isCapturing ? 'capturing' : ''}`}></div>
                          </button>
                          
                          {/* Camera Switch Info */}
                          <div className="camera-info">
                            <span className="camera-label">
                              {facingMode === 'environment' ? 'BACK' : 'FRONT'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Photo Preview */}
              {photoPreview && !showCamera && (
                <div className="photo-preview-container">
                  <img src={photoPreview} alt="Bus photo" className="photo-preview" />
                  <div className="photo-actions">
                    <button 
                      className="action-btn retake-btn"
                      onClick={() => {
                        setPhoto(null);
                        setPhotoPreview(null);
                        handleCameraCapture();
                      }}
                    >
                      📸 Retake
                    </button>
                    <button 
                      className="action-btn next-btn"
                      onClick={() => setCurrentStep(2)}
                    >
                      Next: Location →
                    </button>
                  </div>
                </div>
              )}

              {/* Simplified Photo Capture */}
              {!photoPreview && !showCamera && (
                <div className="capture-options">
                  <button
                    className="capture-option-btn camera-btn"
                    onClick={handleCameraCapture}
                    autoFocus
                  >
                    📸 Take Photo
                  </button>
                  <button
                    className="capture-option-btn file-btn"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    📁 Choose File
                  </button>
                  <button
                    className="capture-option-btn skip-btn"
                    onClick={() => {
                      console.log('🔍 SKIP PHOTO clicked in FloatingCard!');
                      setCurrentStep(2); // Skip to location step
                    }}
                    style={{
                      background: '#FF9800',
                      color: '#000000',
                      border: '2px solid #9C27B0',
                      fontWeight: 'bold'
                    }}
                  >
                    ⏭️ Skip Photo
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Location */}
          {currentStep === 2 && (
            <div className="step-section location-step">
              <div className="step-header">
                <h4>📍 Location</h4>
              </div>

              <div className="location-content">
                <AddressInput
                  label=""
                  placeholder="Where did you see this bus?"
                  onLocationChange={handleLocationChange}
                  onMapPinRequest={handleMapPinRequest}
                  initialLocation={currentLocation}
                  context="floating-card-step"
                  enableGPS={true}
                  enableSearch={true}
                  enableMapPinning={true}
                  enableCoordinates={false}
                  compact={false}
                />
                
                {currentLocation && (
                  <div className="location-confirmation">
                    ✅ {currentLocation.name || currentLocation.display_name || 'Location Set'}
                  </div>
                )}
              </div>

              <div className="step-navigation">
                <button 
                  className="nav-btn back-btn"
                  onClick={() => setCurrentStep(1)}
                >
                  ← Photo
                </button>
                <button 
                  className="nav-btn next-btn"
                  onClick={() => setCurrentStep(3)}
                  disabled={!canProceedToStep(3)}
                >
                  Bus Info →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Bus Number */}
          {currentStep === 3 && (
            <div className="step-section bus-info-step">
              <div className="step-header">
                <h4>🚌 Bus Info</h4>
              </div>

              <div className="bus-info-content">
                <input
                  type="text"
                  value={busNumber}
                  onChange={(e) => setBusNumber(e.target.value)}
                  placeholder="e.g., 102, 156K, Blue Line"
                  className="form-input"
                  autoFocus
                />
                
                <textarea
                  value={additionalInfo}
                  onChange={(e) => setAdditionalInfo(e.target.value)}
                  placeholder="Route info, crowding level, condition... (optional)"
                  className="form-textarea"
                  rows="2"
                />
              </div>

              <div className="step-navigation">
                <button 
                  className="nav-btn back-btn"
                  onClick={() => setCurrentStep(2)}
                >
                  ← Location
                </button>
                <button 
                  className="nav-btn next-btn"
                  onClick={() => setCurrentStep(4)}
                  disabled={!canProceedToStep(4)}
                >
                  Review →
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Submit */}
          {currentStep === 4 && (
            <div className="step-section report-step">
              <div className="step-header">
                <h4>🎯 Submit Report</h4>
              </div>

              <div className="simple-summary">
                📸 Photo: ✓ | 📍 Location: ✓ | 🚌 Bus: {busNumber}
                {additionalInfo && <div>💬 Details: {additionalInfo}</div>}
              </div>

              {error && <div className="error-message">{error}</div>}

              <div className="step-navigation">
                <button 
                  className="nav-btn back-btn"
                  onClick={() => setCurrentStep(3)}
                >
                  ← Back
                </button>
                <button 
                  className="nav-btn submit-btn"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : '🚌 Submit'}
                </button>
              </div>
            </div>
          )}
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

export default FloatingCard;