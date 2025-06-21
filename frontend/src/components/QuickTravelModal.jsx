import { useState, useEffect, useRef } from 'react';
import LocationSearch from './LocationSearch';
import './QuickTravelModal.css';

function QuickTravelModal({ 
  isVisible, 
  onClose, 
  onTravelTo,
  currentLocation 
}) {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const modalRef = useRef(null);

  // Close modal on ESC key
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape' && isVisible) {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener('keydown', handleEscKey);
      return () => document.removeEventListener('keydown', handleEscKey);
    }
  }, [isVisible, onClose]);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isVisible, onClose]);

  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
  };

  const handleTravel = () => {
    if (selectedLocation && onTravelTo) {
      onTravelTo({
        lat: selectedLocation.lat,
        lng: selectedLocation.lng,
        name: selectedLocation.name,
        address: selectedLocation.address
      });
      onClose();
    }
  };

  const formatCurrentLocation = () => {
    if (!currentLocation) return "Unknown location";
    return `${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}`;
  };

  if (!isVisible) return null;

  return (
    <div className="quick-travel-modal-overlay">
      <div className="quick-travel-modal" ref={modalRef}>
        <div className="modal-header">
          <div className="modal-title-section">
            <h2 className="modal-title">
              <span className="title-icon">🔍</span>
              Quick Travel
            </h2>
            <p className="modal-subtitle">Search and travel to any location instantly</p>
          </div>
          <button 
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <div className="modal-body">
          {currentLocation && (
            <div className="current-location-info">
              <span className="location-icon">📍</span>
              <div className="location-details">
                <span className="location-label">Current pin location</span>
                <span className="location-coords">{formatCurrentLocation()}</span>
              </div>
            </div>
          )}

          <div className="search-section">
            <label className="search-label">
              <span className="label-icon">🎯</span>
              Where would you like to go?
            </label>
            <LocationSearch
              placeholder="Search cities, landmarks, addresses..."
              onLocationSelect={handleLocationSelect}
              showCurrentLocation={false}
              autoFocus={true}
            />
          </div>

          {selectedLocation && (
            <div className="selected-location-preview">
              <div className="preview-header">
                <span className="preview-icon">✈️</span>
                <span className="preview-title">Ready to travel</span>
              </div>
              <div className="preview-details">
                <div className="location-name">{selectedLocation.name}</div>
                <div className="location-address">{selectedLocation.address}</div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button 
            className="cancel-btn"
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            className="travel-btn"
            onClick={handleTravel}
            disabled={!selectedLocation}
          >
            <span className="btn-icon">🚀</span>
            Travel Here
          </button>
        </div>
      </div>
    </div>
  );
}

export default QuickTravelModal;