import { useState, useEffect } from 'react';
import { XIcon } from './Icons';
import LocationSearch from './LocationSearch';
import MapView from './MapView';
import { config } from '../config/env';

function LocationModal({ 
  isOpen, 
  onClose, 
  onLocationSelect, 
  mode = 'search', // 'search' or 'map'
  title = "Select Location",
  initialLocation = null,
  referenceLocation = null // For proximity-based search ranking
}) {
  const [currentLocation, setCurrentLocation] = useState(initialLocation);
  const [mapCenter, setMapCenter] = useState([config.defaultMapCenter.lat, config.defaultMapCenter.lng]);

  useEffect(() => {
    if (isOpen && initialLocation) {
      setCurrentLocation(initialLocation);
      setMapCenter([initialLocation.lat, initialLocation.lng]);
    }
  }, [isOpen, initialLocation]);

  const handleLocationSelect = (location) => {
    setCurrentLocation(location);
    onLocationSelect(location);
    onClose();
  };

  const handleMapClick = async (event) => {
    const { lat, lng } = event.lngLat;
    
    // Perform reverse geocoding to get address name
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?` + 
        new URLSearchParams({
          lat: lat.toString(),
          lon: lng.toString(),
          format: 'json',
          'accept-language': 'en'
        }),
        {
          headers: {
            'User-Agent': 'RideShareMVP/1.0'
          }
        }
      );

      let address = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      if (response.ok) {
        const data = await response.json();
        address = data.display_name || address;
      }

      const location = {
        lat,
        lng,
        address,
        type: 'map_click'
      };

      handleLocationSelect(location);
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      handleLocationSelect({
        lat,
        lng,
        address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        type: 'coordinates'
      });
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            address: "Current location",
            type: "current"
          };
          handleLocationSelect(location);
        },
        (error) => {
          alert('Unable to get your location. Please try again or select manually.');
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose}>
            <XIcon size={24} />
          </button>
        </div>

        <div className="modal-content">
          {mode === 'search' ? (
            <div className="search-modal-content">
              <div className="search-actions">
                <button 
                  className="search-action-btn current-location"
                  onClick={getCurrentLocation}
                >
                  📍 Use Current Location
                </button>
              </div>
              
              <div className="search-section">
                <h3>Search for a location</h3>
                <LocationSearch
                  onLocationSelect={handleLocationSelect}
                  placeholder="Search for addresses, places, landmarks..."
                  referenceLocation={referenceLocation}
                />
              </div>
            </div>
          ) : (
            <div className="map-modal-content">
              <div className="map-instructions">
                <p>💡 Tap on the map to select a location</p>
                <button 
                  className="map-action-btn current-location"
                  onClick={getCurrentLocation}
                >
                  📍 Use Current Location
                </button>
              </div>
              
              <div className="map-container">
                <MapView
                  center={mapCenter}
                  zoom={13}
                  markers={currentLocation ? [{
                    latitude: currentLocation.lat,
                    longitude: currentLocation.lng,
                    title: "Selected Location",
                    icon: '📍',
                    color: '#007bff'
                  }] : []}
                  onMapClick={handleMapClick}
                  height="400px"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LocationModal;