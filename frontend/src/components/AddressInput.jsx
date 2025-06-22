import { useState, useEffect, useRef } from 'react';
import LocationSearch from './LocationSearch';
import './AddressInput.css';

/**
 * Unified Address Input Component
 * Configurable for different contexts across the app
 * 
 * Features:
 * - GPS detection (optional)
 * - Address search with autocomplete
 * - Manual coordinate input (optional)
 * - Saved places integration (optional)
 * - Current location detection
 * - Contextual hints and rewards
 */
function AddressInput({
  onLocationChange,
  placeholder = "Enter address, landmark, or bus stop...",
  label = "Location",
  initialLocation = null,
  context = 'default', // 'spot-transport', 'ride-booking', 'emergency', 'profile'
  
  // Feature flags based on context
  enableGPS = true,
  enableSearch = true,
  enableCoordinates = false,
  enableSavedPlaces = false,
  enableCurrentLocation = true,
  
  // Reward/gamification
  showRewards = false,
  rewardMultiplier = 1,
  
  // Styling
  compact = false,
  required = false,
  disabled = false,
  
  // Validation
  validateLocation = null,
  errorMessage = '',
  
  // Context-specific hints
  contextHint = null,
  
  // Map integration
  enableMapPinning = false,
  onMapPinRequest = null,
  
  // Focus behavior
  autoFocus = false
}) {
  const [location, setLocation] = useState(initialLocation);
  const [isDetectingGPS, setIsDetectingGPS] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [manualCoords, setManualCoords] = useState({ lat: '', lng: '' });
  const [locationSource, setLocationSource] = useState('none'); // 'gps', 'search', 'manual', 'saved'
  const [rewardPoints, setRewardPoints] = useState(0);
  
  const inputRef = useRef(null);

  // Context-specific configurations
  const contextConfig = {
    'spot-transport': {
      primaryHint: '📍 Accurate location helps other commuters',
      gpsBonus: 3,
      searchBonus: 2,
      mapPinBonus: 2,
      enableGPS: true,
      enableSearch: true,
      enableMapPinning: true,
      showRewards: true
    },
    'ride-booking': {
      primaryHint: '🚗 Precise pickup location reduces wait time',
      gpsBonus: 2,
      searchBonus: 2,
      enableGPS: true,
      enableSearch: true,
      enableSavedPlaces: true,
      showRewards: false
    },
    'emergency': {
      primaryHint: '🚨 Exact location critical for emergency response',
      gpsBonus: 5,
      searchBonus: 3,
      enableGPS: true,
      enableSearch: true,
      enableCoordinates: true,
      showRewards: false
    },
    'profile': {
      primaryHint: '🏠 Save frequently used locations',
      gpsBonus: 1,
      searchBonus: 1,
      enableGPS: true,
      enableSearch: true,
      enableSavedPlaces: true,
      enableCoordinates: true,
      showRewards: false
    },
    'default': {
      primaryHint: '📍 Enter your location',
      gpsBonus: 1,
      searchBonus: 1,
      enableGPS: true,
      enableSearch: true,
      showRewards: false
    }
  };

  const config = contextConfig[context] || contextConfig.default;

  // Calculate reward points based on location source and context
  useEffect(() => {
    let points = 0;
    if (locationSource === 'gps' && location) {
      points = config.gpsBonus * rewardMultiplier;
    } else if (locationSource === 'search' && location) {
      points = config.searchBonus * rewardMultiplier;
    } else if (locationSource === 'map-pin' && location) {
      points = (config.mapPinBonus || config.searchBonus) * rewardMultiplier;
    } else if (locationSource === 'manual' && location) {
      points = Math.floor(config.searchBonus * 0.8) * rewardMultiplier;
    }
    setRewardPoints(points);
  }, [locationSource, location, config, rewardMultiplier]);

  // Auto-detect GPS location if enabled and user has granted permission
  useEffect(() => {
    const autoDetectGPS = async () => {
      if (!config.enableGPS || !enableCurrentLocation || location) return;

      try {
        if (navigator.permissions) {
          const permission = await navigator.permissions.query({ name: 'geolocation' });
          if (permission.state === 'granted') {
            handleGPSDetection();
          }
        }
      } catch (error) {
        console.log('GPS permission check failed:', error);
      }
    };

    autoDetectGPS();
  }, [config.enableGPS, enableCurrentLocation]);

  const handleGPSDetection = () => {
    if (!navigator.geolocation) {
      setGpsError('GPS not supported by your browser');
      return;
    }

    setIsDetectingGPS(true);
    setGpsError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          source: 'gps',
          display_name: 'Current Location',
          name: 'Your Location'
        };
        
        setLocation(newLocation);
        setLocationSource('gps');
        setIsDetectingGPS(false);
        onLocationChange?.(newLocation);
        console.log('✅ GPS location detected:', newLocation);
      },
      (error) => {
        setGpsError(getGPSErrorMessage(error));
        setIsDetectingGPS(false);
        console.warn('❌ GPS detection failed:', error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: context === 'emergency' ? 5000 : 10000,
        maximumAge: context === 'emergency' ? 30000 : 60000
      }
    );
  };

  const getGPSErrorMessage = (error) => {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return "GPS access denied. Please enable location or search manually.";
      case error.POSITION_UNAVAILABLE:
        return "GPS location unavailable. Please search manually.";
      case error.TIMEOUT:
        return "GPS detection timed out. Please search manually.";
      default:
        return "GPS detection failed. Please search manually.";
    }
  };

  const handleLocationSearch = (selectedLocation) => {
    const newLocation = {
      ...selectedLocation,
      source: 'search'
    };
    
    setLocation(newLocation);
    setLocationSource('search');
    onLocationChange?.(newLocation);
    console.log('✅ Location selected via search:', newLocation);
  };

  const handleManualCoordinates = () => {
    const lat = parseFloat(manualCoords.lat);
    const lng = parseFloat(manualCoords.lng);
    
    if (isNaN(lat) || isNaN(lng)) {
      return;
    }

    const newLocation = {
      lat,
      lng,
      source: 'manual',
      display_name: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      name: 'Manual Coordinates'
    };

    setLocation(newLocation);
    setLocationSource('manual');
    setShowAdvanced(false);
    onLocationChange?.(newLocation);
    console.log('✅ Manual coordinates entered:', newLocation);
  };

  const clearLocation = () => {
    setLocation(null);
    setLocationSource('none');
    setGpsError('');
    setManualCoords({ lat: '', lng: '' });
    onLocationChange?.(null);
  };

  const getLocationDisplayName = () => {
    if (!location) return '';
    
    if (location.source === 'gps') {
      return '📍 Current Location';
    } else if (location.source === 'map-pin') {
      return `📍 ${location.name || 'Pinned Location'}`;
    } else if (location.source === 'manual') {
      return `📌 ${location.display_name}`;
    } else {
      return location.name || location.display_name || 'Selected Location';
    }
  };

  const getLocationDetails = () => {
    if (!location) return '';
    
    const details = [];
    
    if (location.source === 'gps') {
      details.push('GPS');
      if (location.accuracy < 10) details.push('High accuracy');
      else if (location.accuracy < 50) details.push('Good accuracy');
      else details.push('Approximate');
    } else if (location.source === 'search') {
      details.push('Search');
      details.push('Verified');
    } else if (location.source === 'map-pin') {
      details.push('Map Pin');
      details.push('Visual selection');
    } else if (location.source === 'manual') {
      details.push('Manual');
      details.push('Coordinates');
    }
    
    if (config.showRewards && rewardPoints > 0) {
      details.push(`+${rewardPoints} credits`);
    }
    
    return details.join(' • ');
  };

  return (
    <div className={`address-input ${compact ? 'compact' : ''} ${disabled ? 'disabled' : ''}`}>
      {/* Label and Context Hint */}
      {!compact && (
        <div className="address-input-header">
          <label className="address-input-label">
            {label} {required && <span className="required">*</span>}
          </label>
          {contextHint || config.primaryHint && (
            <div className="context-hint">
              <span className="hint-text">{contextHint || config.primaryHint}</span>
            </div>
          )}
        </div>
      )}

      {/* Current Location Display */}
      {location ? (
        <div className="location-selected">
          <div className="location-info">
            <div className="location-name">{getLocationDisplayName()}</div>
            <div className="location-details">{getLocationDetails()}</div>
          </div>
          <button 
            type="button" 
            className="clear-location-btn"
            onClick={clearLocation}
            disabled={disabled}
          >
            ×
          </button>
        </div>
      ) : (
        <div className="address-input-container">
          {/* GPS Detection Status */}
          {isDetectingGPS && (
            <div className="gps-detecting">
              <div className="detecting-animation">
                <div className="pulse-ring"></div>
                <span className="detecting-icon">📡</span>
              </div>
              <span className="detecting-text">Finding your location...</span>
            </div>
          )}

          {/* GPS Error */}
          {gpsError && (
            <div className="gps-error">
              <span className="error-icon">⚠️</span>
              <span className="error-text">{gpsError}</span>
            </div>
          )}

          {/* Main Address Search */}
          {config.enableSearch && (
            <div className="search-section">
              <LocationSearch
                onLocationSelect={handleLocationSearch}
                placeholder={placeholder}
              />
            </div>
          )}

          {/* Quick Actions */}
          <div className="quick-actions">
            {config.enableGPS && enableCurrentLocation && (
              <button
                type="button"
                className={`quick-action-btn gps-btn ${autoFocus ? 'primary-focus' : ''}`}
                onClick={handleGPSDetection}
                disabled={disabled || isDetectingGPS}
                autoFocus={autoFocus && !location}
              >
                📍 Use Current Location
              </button>
            )}
            
            {enableMapPinning && onMapPinRequest && (
              <button
                type="button"
                className="quick-action-btn map-pin-btn"
                onClick={() => onMapPinRequest()}
                disabled={disabled}
              >
                📍 Pin on Map
              </button>
            )}
            
            {enableCoordinates && (
              <button
                type="button"
                className="quick-action-btn advanced-btn"
                onClick={() => setShowAdvanced(!showAdvanced)}
                disabled={disabled}
              >
                📌 Enter Coordinates
              </button>
            )}
          </div>

          {/* Manual Coordinates (Advanced) */}
          {showAdvanced && enableCoordinates && (
            <div className="manual-coordinates">
              <div className="coord-inputs">
                <input
                  type="number"
                  step="any"
                  placeholder="Latitude"
                  value={manualCoords.lat}
                  onChange={(e) => setManualCoords(prev => ({ ...prev, lat: e.target.value }))}
                  disabled={disabled}
                />
                <input
                  type="number"
                  step="any"
                  placeholder="Longitude"
                  value={manualCoords.lng}
                  onChange={(e) => setManualCoords(prev => ({ ...prev, lng: e.target.value }))}
                  disabled={disabled}
                />
              </div>
              <button
                type="button"
                className="apply-coords-btn"
                onClick={handleManualCoordinates}
                disabled={disabled || !manualCoords.lat || !manualCoords.lng}
              >
                Apply Coordinates
              </button>
            </div>
          )}
        </div>
      )}

      {/* Validation Error */}
      {errorMessage && (
        <div className="validation-error">
          <span className="error-icon">⚠️</span>
          <span className="error-text">{errorMessage}</span>
        </div>
      )}

      {/* Reward Preview */}
      {config.showRewards && rewardPoints > 0 && location && (
        <div className="reward-preview">
          <span className="reward-text">+{rewardPoints} credits earned</span>
        </div>
      )}
    </div>
  );
}

export default AddressInput;