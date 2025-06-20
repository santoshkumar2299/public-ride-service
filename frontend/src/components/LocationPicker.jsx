import { useState } from 'react';
import MapView from './MapView';
import CoordinateInput from './CoordinateInput';
import LocationSearch from './LocationSearch';
import { config } from '../config/env';

function LocationPicker({ 
  title = "Pick Locations",
  // Pickup location props
  pickupLatValue, 
  pickupLngValue, 
  onPickupLatChange, 
  onPickupLngChange,
  pickupLatName = "pickup_lat", 
  pickupLngName = "pickup_lng",
  // Destination location props  
  destLatValue, 
  destLngValue, 
  onDestLatChange, 
  onDestLngChange,
  destLatName = "destination_lat", 
  destLngName = "destination_lng",
  // General props
  onCoordinateUpdate,
  required = false,
  showPickup = true,
  showDestination = true,
  // Legacy single location support
  latValue, 
  lngValue, 
  onLatChange, 
  onLngChange,
  latName, 
  lngName, 
  latLabel, 
  lngLabel, 
  latPlaceholder, 
  lngPlaceholder
}) {
  const [showMap, setShowMap] = useState(false);
  const [activeLocation, setActiveLocation] = useState('pickup'); // 'pickup' or 'destination'
  const [searchResult, setSearchResult] = useState(null); // Store last search result

  // Legacy mode support
  const isLegacyMode = !!(latValue !== undefined || onLatChange);

  const handleLocationSearch = (location) => {
    setSearchResult(location);
    
    if (isLegacyMode) {
      // Legacy single location mode
      if (onCoordinateUpdate) {
        onCoordinateUpdate(latName, location.lat.toString(), lngName, location.lng.toString());
      } else {
        onLatChange({ target: { name: latName, value: location.lat.toString() } });
        onLngChange({ target: { name: lngName, value: location.lng.toString() } });
      }
    } else {
      // Dual location mode
      if (activeLocation === 'pickup') {
        if (onCoordinateUpdate) {
          onCoordinateUpdate(pickupLatName, location.lat.toString(), pickupLngName, location.lng.toString());
        } else if (onPickupLatChange && onPickupLngChange) {
          onPickupLatChange({ target: { name: pickupLatName, value: location.lat.toString() } });
          onPickupLngChange({ target: { name: pickupLngName, value: location.lng.toString() } });
        }
      } else {
        if (onCoordinateUpdate) {
          onCoordinateUpdate(destLatName, location.lat.toString(), destLngName, location.lng.toString());
        } else if (onDestLatChange && onDestLngChange) {
          onDestLatChange({ target: { name: destLatName, value: location.lat.toString() } });
          onDestLngChange({ target: { name: destLngName, value: location.lng.toString() } });
        }
      }
    }
  };

  const reverseGeocode = async (lat, lng) => {
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

      if (response.ok) {
        const data = await response.json();
        return {
          lat,
          lng,
          address: data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
          type: 'map_click'
        };
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
    }
    
    return {
      lat,
      lng,
      address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      type: 'coordinates'
    };
  };

  const handleMapClick = async (event) => {
    const { lat, lng } = event.lngLat;
    
    if (isLegacyMode) {
      // Legacy single location mode
      if (onCoordinateUpdate) {
        onCoordinateUpdate(latName, lat.toString(), lngName, lng.toString());
      } else {
        onLatChange({ target: { name: latName, value: lat.toString() } });
        onLngChange({ target: { name: lngName, value: lng.toString() } });
      }
    } else {
      // Dual location mode
      if (activeLocation === 'pickup') {
        if (onCoordinateUpdate) {
          onCoordinateUpdate(pickupLatName, lat.toString(), pickupLngName, lng.toString());
        } else if (onPickupLatChange && onPickupLngChange) {
          onPickupLatChange({ target: { name: pickupLatName, value: lat.toString() } });
          onPickupLngChange({ target: { name: pickupLngName, value: lng.toString() } });
        }
      } else {
        if (onCoordinateUpdate) {
          onCoordinateUpdate(destLatName, lat.toString(), destLngName, lng.toString());
        } else if (onDestLatChange && onDestLngChange) {
          onDestLatChange({ target: { name: destLatName, value: lat.toString() } });
          onDestLngChange({ target: { name: destLngName, value: lng.toString() } });
        }
      }
    }
    
    // Perform reverse geocoding to get address name
    const location = await reverseGeocode(lat, lng);
    setSearchResult(location);
  };

  const getMapMarkers = () => {
    const markers = [];
    
    if (isLegacyMode) {
      // Legacy single location mode
      if (latValue && lngValue && !isNaN(parseFloat(latValue)) && !isNaN(parseFloat(lngValue))) {
        markers.push({
          latitude: parseFloat(latValue),
          longitude: parseFloat(lngValue),
          title: title,
          icon: '📍',
          color: '#007bff'
        });
      }
    } else {
      // Dual location mode
      if (showPickup && pickupLatValue && pickupLngValue && !isNaN(parseFloat(pickupLatValue)) && !isNaN(parseFloat(pickupLngValue))) {
        markers.push({
          latitude: parseFloat(pickupLatValue),
          longitude: parseFloat(pickupLngValue),
          title: "Pickup Location",
          icon: '🚶',
          color: '#007bff'
        });
      }
      
      if (showDestination && destLatValue && destLngValue && !isNaN(parseFloat(destLatValue)) && !isNaN(parseFloat(destLngValue))) {
        markers.push({
          latitude: parseFloat(destLatValue),
          longitude: parseFloat(destLngValue),
          title: "Destination",
          icon: '🎯',
          color: '#28a745'
        });
      }
    }
    
    return markers;
  };

  const getMapCenter = () => {
    if (isLegacyMode) {
      if (latValue && lngValue && !isNaN(parseFloat(latValue)) && !isNaN(parseFloat(lngValue))) {
        return [parseFloat(latValue), parseFloat(lngValue)];
      }
    } else {
      // Center between pickup and destination if both exist
      if (pickupLatValue && pickupLngValue && destLatValue && destLngValue && 
          !isNaN(parseFloat(pickupLatValue)) && !isNaN(parseFloat(pickupLngValue)) &&
          !isNaN(parseFloat(destLatValue)) && !isNaN(parseFloat(destLngValue))) {
        const centerLat = (parseFloat(pickupLatValue) + parseFloat(destLatValue)) / 2;
        const centerLng = (parseFloat(pickupLngValue) + parseFloat(destLngValue)) / 2;
        return [centerLat, centerLng];
      }
      // Otherwise use pickup location if available
      if (pickupLatValue && pickupLngValue && !isNaN(parseFloat(pickupLatValue)) && !isNaN(parseFloat(pickupLngValue))) {
        return [parseFloat(pickupLatValue), parseFloat(pickupLngValue)];
      }
      // Or destination location
      if (destLatValue && destLngValue && !isNaN(parseFloat(destLatValue)) && !isNaN(parseFloat(destLngValue))) {
        return [parseFloat(destLatValue), parseFloat(destLngValue)];
      }
    }
    return [config.defaultMapCenter.lat, config.defaultMapCenter.lng];
  };

  const getRoutes = () => {
    if (!isLegacyMode && pickupLatValue && pickupLngValue && destLatValue && destLngValue &&
        !isNaN(parseFloat(pickupLatValue)) && !isNaN(parseFloat(pickupLngValue)) &&
        !isNaN(parseFloat(destLatValue)) && !isNaN(parseFloat(destLngValue))) {
      return [{
        start: { lat: parseFloat(pickupLatValue), lng: parseFloat(pickupLngValue) },
        end: { lat: parseFloat(destLatValue), lng: parseFloat(destLngValue) },
        color: "#007bff",
        weight: 3,
        title: "Your Route"
      }];
    }
    return [];
  };

  if (isLegacyMode) {
    // Legacy single location mode
    return (
      <div className="location-picker">
        <div className="location-picker-header">
          <h3>{title}</h3>
          <button 
            type="button" 
            onClick={() => setShowMap(!showMap)}
            className="toggle-map-btn"
          >
            {showMap ? '📝 Hide Map' : '🗺️ Show Map'}
          </button>
        </div>

        {/* Location Search */}
        <div className="location-search-header">
          <span className="search-icon">🔍</span>
          <h4>Search for a location</h4>
        </div>
        <LocationSearch
          onLocationSelect={handleLocationSearch}
          placeholder="Search for addresses, places, landmarks..."
        />

        {/* Show search result info */}
        {searchResult && (
          <div className="search-result-info">
            <div className="result-address">{searchResult.address}</div>
            <div className="result-coords">
              📍 {searchResult.lat.toFixed(6)}, {searchResult.lng.toFixed(6)}
            </div>
          </div>
        )}

        <CoordinateInput
          latValue={latValue}
          lngValue={lngValue}
          onLatChange={onLatChange}
          onLngChange={onLngChange}
          onCoordinateUpdate={onCoordinateUpdate}
          latName={latName}
          lngName={lngName}
          latLabel={latLabel}
          lngLabel={lngLabel}
          latPlaceholder={latPlaceholder}
          lngPlaceholder={lngPlaceholder}
          required={required}
        />

        {showMap && (
          <div className="map-container">
            <p className="map-hint">💡 Click on the map to set coordinates</p>
            <MapView
              center={getMapCenter()}
              zoom={13}
              markers={getMapMarkers()}
              onMapClick={handleMapClick}
              height="300px"
            />
          </div>
        )}
      </div>
    );
  }

  // Dual location mode
  return (
    <div className="location-picker">
      <div className="location-picker-header">
        <h3>{title}</h3>
        <button 
          type="button" 
          onClick={() => setShowMap(!showMap)}
          className="toggle-map-btn"
        >
          {showMap ? '📝 Hide Map' : '🗺️ Show Map'}
        </button>
      </div>

      {/* Location Search */}
      <div className="location-search-header">
        <span className="search-icon">🔍</span>
        <h4>Search for {activeLocation === 'pickup' ? (pickupLatName === 'current_lat' ? 'current' : 'pickup') : 'destination'} location</h4>
      </div>
      <LocationSearch
        onLocationSelect={handleLocationSearch}
        placeholder={`Search for ${activeLocation === 'pickup' ? (pickupLatName === 'current_lat' ? 'current' : 'pickup') : 'destination'} location...`}
      />

      {/* Show search result info */}
      {searchResult && (
        <div className="search-result-info">
          <div className="result-address">{searchResult.address}</div>
          <div className="result-coords">
            📍 {searchResult.lat.toFixed(6)}, {searchResult.lng.toFixed(6)}
          </div>
        </div>
      )}

      {/* Location selection mode buttons */}
      {showMap && !isLegacyMode && (
        <div className="location-mode-selector">
          <p className="map-hint">💡 Click on the map to set the selected location</p>
          <div className="location-mode-buttons">
            {showPickup && (
              <button
                type="button"
                className={`location-mode-btn ${activeLocation === 'pickup' ? 'active' : ''}`}
                onClick={() => setActiveLocation('pickup')}
              >
                {pickupLatName === 'current_lat' ? '🚗 Set Current Location' : '🚶 Set Pickup Location'}
              </button>
            )}
            {showDestination && (
              <button
                type="button"
                className={`location-mode-btn ${activeLocation === 'destination' ? 'active' : ''}`}
                onClick={() => setActiveLocation('destination')}
              >
                🎯 Set Destination
              </button>
            )}
          </div>
        </div>
      )}

      {/* Coordinate inputs */}
      <div className="coordinate-inputs">
        {showPickup && (
          <div className="coordinate-section">
            <h4>{pickupLatName === 'current_lat' ? '🚗 Current Location' : '🚶 Pickup Location'}</h4>
            <CoordinateInput
              latValue={pickupLatValue}
              lngValue={pickupLngValue}
              onLatChange={onPickupLatChange}
              onLngChange={onPickupLngChange}
              onCoordinateUpdate={onCoordinateUpdate}
              latName={pickupLatName}
              lngName={pickupLngName}
              latLabel={pickupLatName === 'current_lat' ? 'Current Latitude' : 'Pickup Latitude'}
              lngLabel={pickupLatName === 'current_lat' ? 'Current Longitude' : 'Pickup Longitude'}
              latPlaceholder="e.g., 37.7749"
              lngPlaceholder="e.g., -122.4194"
              required={required}
            />
          </div>
        )}
        
        {showDestination && (
          <div className="coordinate-section">
            <h4>🎯 Destination</h4>
            <CoordinateInput
              latValue={destLatValue}
              lngValue={destLngValue}
              onLatChange={onDestLatChange}
              onLngChange={onDestLngChange}
              onCoordinateUpdate={onCoordinateUpdate}
              latName={destLatName}
              lngName={destLngName}
              latLabel="Destination Latitude"
              lngLabel="Destination Longitude"
              latPlaceholder="e.g., 37.7849"
              lngPlaceholder="e.g., -122.4094"
              required={required}
            />
          </div>
        )}
      </div>

      {showMap && (
        <div className="map-container">
          <MapView
            center={getMapCenter()}
            zoom={13}
            markers={getMapMarkers()}
            routes={getRoutes()}
            onMapClick={handleMapClick}
            height="400px"
          />
        </div>
      )}
    </div>
  );
}

export default LocationPicker;