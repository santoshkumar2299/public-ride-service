import { useState, useEffect } from 'react';
import { CurrentLocationIcon, LocationIcon, SearchIcon } from './Icons';
import LocationSearch from './LocationSearch';
import Portal from './Portal';

function CompactLocationBar({ 
  pickup, 
  destination, 
  onLocationSelect,
  referenceLocation = null,
  user = null // Add user prop to fetch recent locations
}) {
  const [activeField, setActiveField] = useState(null); // 'pickup' or 'destination'
  const [showDropdown, setShowDropdown] = useState(false);
  const [recentLocations, setRecentLocations] = useState([]);

  // Fetch recent locations when component mounts
  useEffect(() => {
    const fetchRecentLocations = async () => {
      if (!user?.id) {
        return;
      }
      
      try {
        const response = await fetch(`http://localhost:3001/api/users/${user.id}/recent-locations?limit=5`);
        
        if (response.ok) {
          const data = await response.json();
          setRecentLocations(data.recentLocations || []);
        }
      } catch (error) {
        console.error('Failed to fetch recent locations:', error);
      }
    };

    fetchRecentLocations();
  }, [user?.id]);

  const handleFieldClick = (field) => {
    if (activeField === field && showDropdown) {
      // Close dropdown if clicking the same field
      setShowDropdown(false);
      setActiveField(null);
    } else {
      // Close any existing dropdown and open for this field
      setShowDropdown(false);
      setActiveField(null);
      
      // Use setTimeout to ensure clean state transition
      setTimeout(() => {
        setActiveField(field);
        setShowDropdown(true);
      }, 50);
    }
  };

  const handleOptionSelect = (option) => {
    if (option.type === 'current') {
      getCurrentLocation();
    } else if (option.type === 'search') {
      // Keep dropdown open but focus on search
      return;
    } else if (option.type === 'location') {
      onLocationSelect({
        lat: option.lat,
        lng: option.lng,
        address: option.address,
        type: activeField
      });
      setShowDropdown(false);
      setActiveField(null);
    }
  };

  const handleLocationSearchSelect = (location) => {
    onLocationSelect({
      lat: location.lat,
      lng: location.lng,
      address: location.address,
      type: activeField
    });
    
    // Close dropdown and clear state
    setShowDropdown(false);
    setActiveField(null);
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          onLocationSelect({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            address: "Current location",
            type: 'pickup'
          });
        },
        (error) => {
          alert('Unable to get your location. Please try again or select manually.');
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  const truncateAddress = (address) => {
    if (!address) return '';
    const parts = address.split(',');
    if (parts.length <= 2) return address;
    return `${parts[0]}, ${parts[1]}`;
  };

  return (
    <>
      <div className="compact-location-bar">
        {/* Pickup Field */}
        <div className={`compact-location-field pickup-field ${showDropdown && activeField === 'pickup' ? 'expanded' : ''}`}>
          <div 
            className="field-header"
            onClick={() => handleFieldClick('pickup')}
          >
            <div className="field-icon">
              <CurrentLocationIcon size={16} color="#007bff" />
            </div>
            <div className="field-content">
              <div className="field-label">From</div>
              <div className="field-value">
                {pickup?.address ? truncateAddress(pickup.address) : "Choose pickup location"}
              </div>
            </div>
            <button 
              className="current-location-btn"
              onClick={(e) => {
                e.stopPropagation();
                getCurrentLocation();
              }}
              title="Use current location"
            >
              📍
            </button>
          </div>
          
          {/* Pickup Options */}
          {showDropdown && activeField === 'pickup' && (
            <div className="field-options">
              <div className="option-item" onClick={() => handleOptionSelect({ type: 'current' })}>
                📍 Use Current Location
              </div>
              <div className="option-item" onClick={() => { alert('Map selection coming soon!'); setShowDropdown(false); }}>
                🗺️ Select on Map
              </div>
              <div className="option-item" onClick={() => { alert('Saved locations coming soon!'); setShowDropdown(false); }}>
                🏠 Home
              </div>
              <div className="option-item" onClick={() => { alert('Saved locations coming soon!'); setShowDropdown(false); }}>
                💼 Work
              </div>
              
              {/* Recent Locations */}
              {recentLocations.length > 0 ? (
                <>
                  <div className="option-divider"></div>
                  <div className="recent-locations-header">Recent places</div>
                  {recentLocations.slice(0, 3).map((location, index) => (
                    <div 
                      key={index}
                      className="option-item recent-location" 
                      onClick={() => handleOptionSelect({ 
                        type: 'location', 
                        lat: location.lat, 
                        lng: location.lng, 
                        address: location.address 
                      })}
                    >
                      🕒 {location.address}
                    </div>
                  ))}
                </>
              ) : null}
              
              <div className="search-options">
                <LocationSearch
                  key={`pickup-search-${showDropdown && activeField === 'pickup' ? 'active' : 'inactive'}`}
                  onLocationSelect={handleLocationSearchSelect}
                  placeholder="Search for pickup location..."
                  referenceLocation={null}
                />
              </div>
            </div>
          )}
        </div>

        {/* Destination Field */}
        <div className={`compact-location-field destination-field ${showDropdown && activeField === 'destination' ? 'expanded' : ''}`}>
          <div 
            className="field-header"
            onClick={() => handleFieldClick('destination')}
          >
            <div className="field-icon">
              <LocationIcon size={16} color="#28a745" />
            </div>
            <div className="field-content">
              <div className="field-label">To</div>
              <div className="field-value">
                {destination?.address ? truncateAddress(destination.address) : "Choose destination"}
              </div>
            </div>
            <div className="field-action">
              <SearchIcon size={16} color="#666" />
            </div>
          </div>
          
          {/* Destination Options */}
          {showDropdown && activeField === 'destination' && (
            <div className="field-options">
              <div className="option-item" onClick={() => handleOptionSelect({ type: 'current' })}>
                📍 Use Current Location
              </div>
              <div className="option-item" onClick={() => { alert('Map selection coming soon!'); setShowDropdown(false); }}>
                🗺️ Select on Map
              </div>
              <div className="option-item" onClick={() => { alert('Saved locations coming soon!'); setShowDropdown(false); }}>
                🏠 Home
              </div>
              <div className="option-item" onClick={() => { alert('Saved locations coming soon!'); setShowDropdown(false); }}>
                💼 Work
              </div>
              
              {/* Recent Locations */}
              {recentLocations.length > 0 ? (
                <>
                  <div className="option-divider"></div>
                  <div className="recent-locations-header">Recent places</div>
                  {recentLocations.slice(0, 3).map((location, index) => (
                    <div 
                      key={index}
                      className="option-item recent-location" 
                      onClick={() => handleOptionSelect({ 
                        type: 'location', 
                        lat: location.lat, 
                        lng: location.lng, 
                        address: location.address 
                      })}
                    >
                      🕒 {location.address}
                    </div>
                  ))}
                </>
              ) : null}
              
              <div className="search-options">
                <LocationSearch
                  key={`destination-search-${showDropdown && activeField === 'destination' ? 'active' : 'inactive'}`}
                  onLocationSelect={handleLocationSearchSelect}
                  placeholder="Search for destination..."
                  referenceLocation={null}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default CompactLocationBar;