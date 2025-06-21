import { useState, useEffect, useRef, useCallback } from 'react';
import { useTransport } from '../contexts/TransportContext';
import './SleekBusReporting.css';

const SleekBusReporting = ({ user, currentLocation, onReport }) => {
  const { routes } = useTransport();
  
  // UI States
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null); // 'spot' or 'traveling'
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  // Form States
  const [busNumber, setBusNumber] = useState('');
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [confidence, setConfidence] = useState('high');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [attachedPhoto, setAttachedPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  
  // Refs
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ESC key support
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    if (isExpanded || selectedAction) {
      document.addEventListener('keydown', handleEscKey);
      return () => document.removeEventListener('keydown', handleEscKey);
    }
  }, [isExpanded, selectedAction]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        if (isExpanded && !selectedAction) {
          setIsExpanded(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isExpanded, selectedAction]);

  // Position the modal based on click location (HUMAN-FRIENDLY)
  const handleFABClick = useCallback((event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const isMobile = window.innerWidth <= 768;
    const modalWidth = isMobile ? Math.min(350, window.innerWidth - 40) : 320;
    const modalHeight = 300;
    const padding = 20;
    
    // Calculate position near the FAB but within viewport
    let x = rect.left + rect.width / 2;
    let y = rect.top - modalHeight - 10; // Above the FAB
    
    // Mobile-specific positioning (HUMANS need to reach it easily)
    if (isMobile) {
      // On mobile, always show above the FAB if possible, otherwise below
      y = rect.top - modalHeight - 10;
      if (y < padding) {
        y = rect.bottom + 10; // Below the FAB
      }
      
      // Center horizontally on mobile for easier thumb access
      x = window.innerWidth / 2;
    } else {
      // Desktop positioning
      // Keep within left/right bounds (HUMAN can see it)
      if (x + modalWidth/2 > window.innerWidth - padding) {
        x = window.innerWidth - modalWidth/2 - padding;
      }
      if (x - modalWidth/2 < padding) {
        x = modalWidth/2 + padding;
      }
      
      // If not enough space above, show below (HUMAN can reach it)
      if (y < padding) {
        y = rect.bottom + 10; // Below the FAB
      }
    }
    
    // Keep within top/bottom bounds (ALWAYS VISIBLE TO HUMAN)
    if (y + modalHeight > window.innerHeight - padding) {
      y = window.innerHeight - modalHeight - padding;
    }
    if (y < padding) {
      y = padding;
    }
    
    console.log('🧠 HUMAN-FRIENDLY Modal Position:', { x, y, isMobile, viewport: { w: window.innerWidth, h: window.innerHeight } });
    
    setPosition({ x, y });
    setIsExpanded(true);
  }, []);

  // Handle photo attachment
  const handlePhotoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type and size
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        alert('Please select a valid image file (JPEG, PNG, WebP)');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('Image size should be less than 5MB');
        return;
      }

      setAttachedPhoto(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setPhotoPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  // Remove photo
  const removePhoto = () => {
    setAttachedPhoto(null);
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!busNumber || !currentLocation) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      
      // Basic report data
      formData.append('type', selectedAction);
      formData.append('bus_number', busNumber);
      formData.append('route_id', selectedRoute?.id || '');
      formData.append('location', JSON.stringify(currentLocation));
      formData.append('confidence', confidence);
      formData.append('additional_info', additionalInfo);
      formData.append('user_id', user.id);
      formData.append('timestamp', new Date().toISOString());
      
      // Attach photo if present
      if (attachedPhoto) {
        formData.append('photo', attachedPhoto);
      }

      await onReport(formData, selectedAction);
      handleClose();
    } catch (error) {
      console.error('Error submitting report:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form and close
  const handleClose = () => {
    setIsExpanded(false);
    setSelectedAction(null);
    setBusNumber('');
    setSelectedRoute(null);
    setConfidence('high');
    setAdditionalInfo('');
    removePhoto();
  };

  // Get suggested routes
  const getSuggestedRoutes = () => {
    if (!busNumber) return [];
    return routes.filter(route => 
      route.route_number.toLowerCase().includes(busNumber.toLowerCase())
    ).slice(0, 3);
  };

  // Render the floating action button
  const renderFAB = () => (
    <button 
      className={`fab-report ${isExpanded ? 'expanded' : ''}`}
      onClick={handleFABClick}
      title="Report Bus Location"
      aria-label="Report Bus Location"
    >
      <span className="fab-icon">📍</span>
      <span className="fab-text">Report</span>
    </button>
  );

  // Render action selection
  const renderActionSelection = () => (
    <div 
      className="action-selection-panel"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translateX(-50%)' // Only center horizontally
      }}
    >
      <div className="panel-header">
        <h4>🚌 Report Bus</h4>
        <button className="close-btn" onClick={handleClose} aria-label="Close">×</button>
      </div>
      
      <div className="action-buttons">
        <button 
          className="action-btn spot-btn"
          onClick={() => setSelectedAction('spot')}
        >
          <div className="btn-icon">👀</div>
          <div className="btn-content">
            <span className="btn-title">I Saw a Bus</span>
            <span className="btn-subtitle">Quick spot report</span>
          </div>
        </button>
        
        <button 
          className="action-btn travel-btn"
          onClick={() => setSelectedAction('traveling')}
        >
          <div className="btn-icon">🚌</div>
          <div className="btn-content">
            <span className="btn-title">I'm Traveling</span>
            <span className="btn-subtitle">Live tracking</span>
          </div>
        </button>
      </div>
      
      <div className="panel-footer">
        <span className="location-indicator">📍 Using current location</span>
      </div>
    </div>
  );

  // Render detailed form
  const renderDetailedForm = () => {
    const suggestedRoutes = getSuggestedRoutes();
    
    return (
      <div 
        className="detailed-form-panel"
        style={{
          left: position.x,
          top: position.y,
          transform: 'translateX(-50%)' // Only center horizontally
        }}
      >
        <div className="panel-header">
          <button className="back-btn" onClick={() => setSelectedAction(null)}>←</button>
          <h4>
            {selectedAction === 'spot' ? '👀 Bus Spotted' : '🚌 Live Tracking'}
          </h4>
          <button className="close-btn" onClick={handleClose}>×</button>
        </div>

        <div className="form-content">
          {/* Bus Number Input */}
          <div className="input-group">
            <label>Bus Number</label>
            <input
              type="text"
              placeholder="e.g., 185G, 102"
              value={busNumber}
              onChange={(e) => setBusNumber(e.target.value.toUpperCase())}
              className="bus-input"
              autoFocus
            />
            
            {/* Route Suggestions */}
            {suggestedRoutes.length > 0 && (
              <div className="suggestions">
                {suggestedRoutes.map(route => (
                  <button
                    key={route.id}
                    className={`suggestion ${selectedRoute?.id === route.id ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedRoute(route);
                      setBusNumber(route.route_number);
                    }}
                  >
                    <span className="route-num">{route.route_number}</span>
                    <span className="route-desc">{route.start_point} → {route.end_point}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Photo Attachment */}
          <div className="input-group">
            <label>📸 Attach Photo (Optional)</label>
            <div className="photo-upload">
              {!photoPreview ? (
                <button 
                  className="upload-btn"
                  onClick={() => fileInputRef.current?.click()}
                  type="button"
                >
                  <span className="upload-icon">📷</span>
                  <span>Add ticket or bus photo</span>
                </button>
              ) : (
                <div className="photo-preview">
                  <img src={photoPreview} alt="Bus/ticket photo" />
                  <button className="remove-photo" onClick={removePhoto}>×</button>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handlePhotoUpload}
                style={{ display: 'none' }}
              />
            </div>
          </div>

          {/* Confidence Level */}
          <div className="input-group">
            <label>Confidence</label>
            <div className="confidence-buttons">
              {[
                { value: 'high', emoji: '💯', label: 'Very Sure' },
                { value: 'medium', emoji: '😐', label: 'Somewhat' },
                { value: 'low', emoji: '🤔', label: 'Not Sure' }
              ].map(({ value, emoji, label }) => (
                <button
                  key={value}
                  className={`confidence-btn ${confidence === value ? 'selected' : ''}`}
                  onClick={() => setConfidence(value)}
                >
                  <span className="conf-emoji">{emoji}</span>
                  <span className="conf-label">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Additional Info */}
          <div className="input-group">
            <label>Additional Info (Optional)</label>
            <textarea
              placeholder={
                selectedAction === 'spot' 
                  ? "e.g., Bus heading towards HITEC City, quite full"
                  : "e.g., Bus is on time, next stop Madhapur"
              }
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              className="info-textarea"
              rows={2}
            />
          </div>

          {/* Submit Button */}
          <button 
            className={`submit-btn ${selectedAction}`}
            onClick={handleSubmit}
            disabled={!busNumber || isSubmitting}
          >
            {isSubmitting ? (
              <span>📤 Submitting...</span>
            ) : (
              <span>
                {selectedAction === 'spot' ? '📍 Report Spot' : '🚌 Start Tracking'}
              </span>
            )}
          </button>

          {/* Quick Stats */}
          <div className="quick-stats">
            <div className="stat">
              <span className="stat-label">Points:</span>
              <span className="stat-value">
                +{confidence === 'high' ? '5' : confidence === 'medium' ? '3' : '1'}
              </span>
            </div>
            <div className="stat">
              <span className="stat-label">Type:</span>
              <span className="stat-value">
                {selectedAction === 'spot' ? 'One-time' : 'Live track'}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="sleek-bus-reporting" ref={containerRef}>
      {/* Always visible FAB */}
      {renderFAB()}
      
      {/* Overlay for expanded states */}
      {(isExpanded || selectedAction) && (
        <div className="sleek-overlay" onClick={handleClose} />
      )}
      
      {/* Action selection panel */}
      {isExpanded && !selectedAction && renderActionSelection()}
      
      {/* Detailed form panel */}
      {selectedAction && renderDetailedForm()}
    </div>
  );
};

export default SleekBusReporting;