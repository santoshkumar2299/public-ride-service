import { useState, useEffect } from 'react';
import { LocationIcon, MapIcon, SearchIcon, CurrentLocationIcon, HomeIcon, WorkIcon, XIcon } from './Icons';
import LocationSearch from './LocationSearch';
import MapLocationSelector from './MapLocationSelector';
import Portal from './Portal';

function LocationInput({ 
  label, 
  value, 
  address, 
  onLocationSelect, 
  placeholder = "Where to?",
  type = "destination", // "pickup" or "destination"
  referenceLocation = null, // For smart city filtering
  variant = "default" // "default" or "compact"
}) {
  const [showActions, setShowActions] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Handle Escape key for search modal
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setShowSearchModal(false);
      }
    };

    if (showSearchModal) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [showSearchModal]);

  // Handle Escape key for map modal
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setShowMapModal(false);
      }
    };

    if (showMapModal) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [showMapModal]);

  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          onLocationSelect({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            address: "Current location",
            type: "current"
          });
        },
        (error) => {
          alert('Unable to get your location. Please try again or select manually.');
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
    setShowActions(false);
  };

  const handleSearchSelect = () => {
    setShowSearchModal(true);
    setShowActions(false);
  };

  const handleMapSelect = () => {
    setShowMapModal(true);
    setShowActions(false);
  };

  const handleLocationSearchSelect = (location) => {
    onLocationSelect({
      lat: location.lat,
      lng: location.lng,
      address: location.address,
      type: 'search'
    });
    setShowSearchModal(false);
  };

  const handleMapLocationSelect = (location) => {
    onLocationSelect({
      lat: location.lat,
      lng: location.lng,
      address: location.address || `Location: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`,
      type: 'map'
    });
    setShowMapModal(false);
  };

  const handleSavedLocation = async (locationType) => {
    try {
      // For now, show search modal while we implement backend integration
      // In production, this would fetch the saved location from the backend
      setShowSearchModal(true);
      setShowActions(false);
      
      // Future implementation:
      // const response = await fetch(`/api/users/${user.id}/saved-places?type=${locationType}`)
      // const data = await response.json()
      // if (data.place) {
      //   onLocationSelect({
      //     lat: data.place.lat,
      //     lng: data.place.lng,
      //     address: data.place.address,
      //     type: locationType
      //   })
      // }
    } catch (error) {
      console.error('Error loading saved location:', error);
      setShowSearchModal(true);
      setShowActions(false);
    }
  };

  // Smart address truncation
  const truncateAddress = (fullAddress) => {
    if (!fullAddress) return '';
    
    const parts = fullAddress.split(',').map(part => part.trim());
    
    // Show first 2-3 meaningful parts (usually landmark + area + city)
    if (parts.length <= 2) return fullAddress;
    if (parts.length === 3) return parts.slice(0, 2).join(', ');
    
    // For longer addresses, show first part + city (usually last meaningful part before state/country)
    const cityIndex = Math.min(2, parts.length - 2); // Avoid state/country/pincode
    return `${parts[0]}, ${parts[cityIndex]}`;
  };

  const handleCardClick = () => {
    if (address) {
      // If address exists, toggle expansion
      setIsExpanded(!isExpanded);
    } else {
      // If no address, show actions
      setShowActions(!showActions);
    }
  };

  // Compact variant for forms
  if (variant === "compact") {
    return (
      <div className="location-input-compact">
        <label className="location-label-compact">{label}</label>
        <div className="location-compact-container">
          <div 
            className="location-compact-field"
            onClick={() => setShowActions(!showActions)}
          >
            <div className="compact-field-icon">
              {type === 'pickup' ? <CurrentLocationIcon size={18} color="#007bff" /> : <LocationIcon size={18} color="#28a745" />}
            </div>
            <div className="compact-field-content">
              {address ? (
                <span className="compact-address">{truncateAddress(address)}</span>
              ) : (
                <span className="compact-placeholder">{placeholder}</span>
              )}
            </div>
            <div className="compact-field-action">
              <span className={`compact-arrow ${showActions ? 'up' : 'down'}`}>▼</span>
            </div>
          </div>

          {showActions && (
            <div className="location-actions-compact">
              <button 
                className="location-action-compact current-location"
                onClick={handleCurrentLocation}
              >
                <CurrentLocationIcon size={16} color="#007bff" />
                <span>Current location</span>
              </button>
              
              <button 
                className="location-action-compact search-location"
                onClick={handleSearchSelect}
              >
                <SearchIcon size={16} color="#666" />
                <span>Search location</span>
              </button>
              
              <button 
                className="location-action-compact map-location"
                onClick={handleMapSelect}
              >
                <MapIcon size={16} color="#666" />
                <span>Select on map</span>
              </button>
            </div>
          )}
        </div>

        {/* Search Location Modal */}
        {showSearchModal && (
          <Portal>
            <div className="modal-overlay" onClick={() => setShowSearchModal(false)}>
              <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>Search Location</h2>
                  <div className="modal-header-actions">
                    <span className="modal-hint">Press Esc to close</span>
                    <button 
                      className="modal-close"
                      onClick={() => setShowSearchModal(false)}
                    >
                      <XIcon size={20} />
                    </button>
                  </div>
                </div>
                <div className="modal-content">
                  <div className="search-modal-content">
                    <LocationSearch
                      onLocationSelect={handleLocationSearchSelect}
                      placeholder={`Search for ${label?.toLowerCase() || 'location'}...`}
                      referenceLocation={referenceLocation}
                    />
                  </div>
                </div>
              </div>
            </div>
          </Portal>
        )}

        {/* Map Selection Modal */}
        {showMapModal && (
          <Portal>
            <div className="modal-overlay" onClick={() => setShowMapModal(false)}>
              <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>Select on Map</h2>
                  <div className="modal-header-actions">
                    <span className="modal-hint">Press Esc to close</span>
                    <button 
                      className="modal-close"
                      onClick={() => setShowMapModal(false)}
                    >
                      <XIcon size={20} />
                    </button>
                  </div>
                </div>
                <div className="modal-content">
                  <div className="map-modal-content">
                    <MapLocationSelector
                      onLocationSelect={handleMapLocationSelect}
                      type={type}
                    />
                  </div>
                </div>
              </div>
            </div>
          </Portal>
        )}
      </div>
    );
  }

  // Default variant (existing design)
  return (
    <div className="location-input">
      <label className="location-label">{label}</label>
      
      <div 
        className={`location-input-card ${isExpanded ? 'expanded' : ''}`} 
        onClick={handleCardClick}
      >
        <div className="location-input-content">
          <div className="location-input-icon">
            {type === 'pickup' ? <CurrentLocationIcon size={20} color="#007bff" /> : <LocationIcon size={20} color="#28a745" />}
          </div>
          <div className="location-input-text">
            {address ? (
              <div className="location-address">
                <div className="address-display">
                  {isExpanded ? address : truncateAddress(address)}
                </div>
                {!isExpanded && address.length > truncateAddress(address).length && (
                  <div className="address-hint">Tap to see full address</div>
                )}
              </div>
            ) : (
              <div className="location-placeholder">{placeholder}</div>
            )}
          </div>
          <div className="location-input-arrow">
            {address ? (
              <span className={`arrow ${isExpanded ? 'up' : 'down'}`}>▼</span>
            ) : (
              <span className={`arrow ${showActions ? 'up' : 'down'}`}>▼</span>
            )}
          </div>
        </div>
        
        {/* Edit button when address is selected */}
        {address && isExpanded && (
          <div className="address-actions">
            <button 
              className="edit-location-btn"
              onClick={(e) => {
                e.stopPropagation();
                setShowActions(true);
                setIsExpanded(false);
              }}
            >
              📝 Change Location
            </button>
          </div>
        )}
      </div>

      {showActions && (
        <div className="location-actions">
          <button 
            className="location-action-btn current-location"
            onClick={handleCurrentLocation}
          >
            <CurrentLocationIcon size={20} color="#007bff" />
            <span>Use current location</span>
          </button>
          
          <button 
            className="location-action-btn search-location"
            onClick={handleSearchSelect}
          >
            <SearchIcon size={20} color="#666" />
            <span>Search location</span>
          </button>
          
          <button 
            className="location-action-btn map-location"
            onClick={handleMapSelect}
          >
            <MapIcon size={20} color="#666" />
            <span>Select on map</span>
          </button>

          <div className="location-actions-divider"></div>
          
          <button 
            className="location-action-btn saved-location"
            onClick={() => handleSavedLocation('home')}
          >
            <HomeIcon size={20} color="#666" />
            <span>Home</span>
          </button>
          
          <button 
            className="location-action-btn saved-location"
            onClick={() => handleSavedLocation('work')}
          >
            <WorkIcon size={20} color="#666" />
            <span>Work</span>
          </button>
        </div>
      )}

      {/* Search Location Modal */}
      {showSearchModal && (
        <Portal>
          <div className="modal-overlay" onClick={() => setShowSearchModal(false)}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Search Location</h2>
                <div className="modal-header-actions">
                  <span className="modal-hint">Press Esc to close</span>
                  <button 
                    className="modal-close"
                    onClick={() => setShowSearchModal(false)}
                  >
                    <XIcon size={20} />
                  </button>
                </div>
              </div>
              <div className="modal-content">
                <div className="search-modal-content">
                  <LocationSearch
                    onLocationSelect={handleLocationSearchSelect}
                    placeholder={`Search for ${label?.toLowerCase() || 'location'}...`}
                    referenceLocation={referenceLocation}
                  />
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Map Selection Modal */}
      {showMapModal && (
        <Portal>
          <div className="modal-overlay" onClick={() => setShowMapModal(false)}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Select on Map</h2>
                <div className="modal-header-actions">
                  <span className="modal-hint">Press Esc to close</span>
                  <button 
                    className="modal-close"
                    onClick={() => setShowMapModal(false)}
                  >
                    <XIcon size={20} />
                  </button>
                </div>
              </div>
              <div className="modal-content">
                <div className="map-modal-content">
                  <MapLocationSelector
                    onLocationSelect={handleMapLocationSelect}
                    type={type}
                  />
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}

export default LocationInput;