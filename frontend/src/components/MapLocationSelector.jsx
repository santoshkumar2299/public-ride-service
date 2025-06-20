import { useState, useEffect } from 'react'
import MapView from './MapView'
import { TargetIcon, CheckIcon } from './Icons'

const MapLocationSelector = ({ onLocationSelect, initialLocation, type = 'destination' }) => {
  const [selectedLocation, setSelectedLocation] = useState(initialLocation)
  const [center, setCenter] = useState([37.7749, -122.4194]) // Default to San Francisco
  const [markers, setMarkers] = useState([])

  useEffect(() => {
    // Get user's current location for map center
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = [position.coords.latitude, position.coords.longitude]
          setCenter(userLocation)
        },
        (error) => {
          console.log('Could not get current location for map center')
        }
      )
    }
  }, [])

  useEffect(() => {
    // Update markers when selected location changes
    const newMarkers = []
    
    if (selectedLocation) {
      newMarkers.push({
        latitude: selectedLocation.lat,
        longitude: selectedLocation.lng,
        title: `Selected ${type}`,
        description: selectedLocation.address || `Lat: ${selectedLocation.lat.toFixed(4)}, Lng: ${selectedLocation.lng.toFixed(4)}`,
        icon: '📍',
        color: type === 'pickup' ? '#007bff' : '#28a745'
      })
    }
    
    setMarkers(newMarkers)
  }, [selectedLocation, type])

  const handleMapClick = (event) => {
    const { lat, lng } = event.lngLat
    
    setSelectedLocation({
      lat,
      lng,
      address: `Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`
    })
  }

  const handleConfirmLocation = () => {
    if (selectedLocation && onLocationSelect) {
      onLocationSelect(selectedLocation)
    }
  }

  return (
    <div className="map-location-selector">
      <div className="map-instructions">
        <div className="instruction-header">
          <TargetIcon size={20} color="#007bff" />
          <p>Click on the map to select your {type}</p>
        </div>
        {selectedLocation && (
          <button 
            className="confirm-location-btn"
            onClick={handleConfirmLocation}
          >
            <CheckIcon size={16} />
            Confirm Location
          </button>
        )}
      </div>
      
      <div className="map-container">
        <MapView
          center={center}
          zoom={13}
          markers={markers}
          onMapClick={handleMapClick}
          height="400px"
          showControls={true}
        />
      </div>
      
      {selectedLocation && (
        <div className="selected-location-info">
          <h4>Selected Location</h4>
          <p className="location-coords">
            Latitude: {selectedLocation.lat.toFixed(6)}
          </p>
          <p className="location-coords">
            Longitude: {selectedLocation.lng.toFixed(6)}
          </p>
        </div>
      )}
    </div>
  )
}

export default MapLocationSelector