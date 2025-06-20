import { useState } from 'react';
import MapView from './MapView';
import CoordinateInput from './CoordinateInput';
import { config } from '../config/env';

function LocationPicker({ 
  title = "Pick Location",
  latValue, 
  lngValue, 
  onLatChange, 
  onLngChange,
  onCoordinateUpdate,
  latName, 
  lngName, 
  latLabel, 
  lngLabel, 
  latPlaceholder, 
  lngPlaceholder,
  required = false 
}) {
  const [showMap, setShowMap] = useState(false);

  const handleMapClick = (event) => {
    const { lat, lng } = event.lngLat;
    if (onCoordinateUpdate) {
      onCoordinateUpdate(latName, lat.toString(), lngName, lng.toString());
    } else {
      onLatChange({ target: { name: latName, value: lat.toString() } });
      onLngChange({ target: { name: lngName, value: lng.toString() } });
    }
  };

  const getMapMarkers = () => {
    if (latValue && lngValue && !isNaN(parseFloat(latValue)) && !isNaN(parseFloat(lngValue))) {
      return [{
        latitude: parseFloat(latValue),
        longitude: parseFloat(lngValue),
        title: title,
        icon: '📍',
        color: '#007bff'
      }];
    }
    return [];
  };

  const getMapCenter = () => {
    if (latValue && lngValue && !isNaN(parseFloat(latValue)) && !isNaN(parseFloat(lngValue))) {
      return [parseFloat(latValue), parseFloat(lngValue)]; // Leaflet uses [lat, lng] order
    }
    return [config.defaultMapCenter.lat, config.defaultMapCenter.lng];
  };

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

export default LocationPicker;