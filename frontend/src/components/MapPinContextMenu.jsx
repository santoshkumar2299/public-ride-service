import { useState, useEffect, useRef } from 'react';
import './MapPinContextMenu.css';

function MapPinContextMenu({ 
  position, 
  coordinates, 
  isVisible, 
  onClose, 
  onGoHere, 
  onStartFromHere, 
  onHowToGo,
  onAddToFavorites,
  onEditLocation,
  onBookRide,
  onSelectLocation
}) {
  const menuRef = useRef(null);
  const [placeName, setPlaceName] = useState(null);
  const [isLoadingPlace, setIsLoadingPlace] = useState(false);
  const [adjustedPosition, setAdjustedPosition] = useState(position);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isVisible, onClose]);

  // Close menu on ESC key
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

  // ✅ HUMAN UX: Adjust position to stay within viewport bounds
  useEffect(() => {
    if (isVisible && position) {
      const menuWidth = 320; // max-width from CSS
      const menuHeight = 400; // estimated height
      
      // 🧠 RESEARCH-BASED PADDING: Better UX when elements are comfortably inside viewport
      // - Mobile: 24px recommended (touch-friendly, accounts for cases & curved screens)
      // - Desktop: 32px optimal (prevents edge-scroll conflicts, better visual comfort)
      // - Research shows 20% larger margins improve usability significantly
      const isMobile = window.innerWidth <= 768;
      const padding = isMobile ? 24 : 32;
      
      const adjustedPos = {
        x: Math.min(position.x, window.innerWidth - menuWidth - padding),
        y: Math.min(position.y, window.innerHeight - menuHeight - padding)
      };
      
      // Ensure minimum distances from edges
      adjustedPos.x = Math.max(padding, adjustedPos.x);
      adjustedPos.y = Math.max(padding, adjustedPos.y);
      
      setAdjustedPosition(adjustedPos);
    }
  }, [isVisible, position]);

  // Reverse geocode to get place name
  useEffect(() => {
    if (isVisible && coordinates) {
      setIsLoadingPlace(true);
      setPlaceName(null);
      
      const fetchPlaceName = async () => {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?` + 
            new URLSearchParams({
              lat: coordinates.lat.toString(),
              lon: coordinates.lng.toString(),
              format: 'json',
              addressdetails: '1',
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
            const address = data.address || {};
            
            // Create a meaningful place name
            const road = address.road || address.pedestrian || address.footway;
            const area = address.neighbourhood || address.suburb || address.village || address.town || address.city;
            const displayName = data.display_name;
            
            let placeName = '';
            if (road && area) {
              placeName = `${road}, ${area}`;
            } else if (road) {
              placeName = road;
            } else if (area) {
              placeName = area;
            } else if (displayName) {
              // Use first two parts of display name
              const parts = displayName.split(',').slice(0, 2);
              placeName = parts.join(',').trim();
            }
            
            setPlaceName(placeName || 'Unknown location');
          }
        } catch (error) {
          console.error('Reverse geocoding error:', error);
          setPlaceName('Location lookup failed');
        } finally {
          setIsLoadingPlace(false);
        }
      };
      
      // Debounce the request slightly
      const timeoutId = setTimeout(fetchPlaceName, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [isVisible, coordinates]);

  if (!isVisible || !position || !coordinates) return null;

  const handleAction = (action, actionFn) => {
    console.log(`Map pin action: ${action}`, coordinates);
    if (actionFn) {
      actionFn(coordinates);
    }
    onClose();
  };

  // Format coordinates for display
  const formatCoordinate = (coord) => coord.toFixed(4);

  return (
    <div 
      className="map-pin-context-menu"
      ref={menuRef}
      style={{
        position: 'fixed',
        top: adjustedPosition?.y || position?.y,
        left: adjustedPosition?.x || position?.x,  
        zIndex: 10000,
        pointerEvents: 'auto'
      }}
    >
      <div className="pin-menu-header">
        <div className="pin-location-info">
          <span className="pin-icon">📍</span>
          <div className="pin-coordinates">
            {isLoadingPlace 
              ? 'Finding location...' 
              : placeName || `${formatCoordinate(coordinates.lat)}, ${formatCoordinate(coordinates.lng)}`
            }
          </div>
        </div>
        <button 
          className="pin-close-btn"
          onClick={onClose}
          aria-label="Close menu"
        >
          ×
        </button>
      </div>

      <div className="pin-menu-actions">
        <button 
          className="pin-action-btn edit-location primary"
          onClick={() => handleAction('edit-location', onEditLocation)}
        >
          <span className="action-icon">🔍</span>
          <span className="action-text">Search & Travel</span>
          <span className="action-description">Quick location search</span>
        </button>

        <button 
          className="pin-action-btn go-here"
          onClick={() => handleAction('go-here', onGoHere)}
        >
          <span className="action-icon">🎯</span>
          <span className="action-text">Go to this place</span>
          <span className="action-description">Set as destination</span>
        </button>

        <button 
          className="pin-action-btn start-from-here"
          onClick={() => handleAction('start-from-here', onStartFromHere)}
        >
          <span className="action-icon">🚀</span>
          <span className="action-text">Start from here</span>
          <span className="action-description">Set as origin point</span>
        </button>

        <button 
          className="pin-action-btn select-location featured"
          onClick={() => handleAction('select-transport-location', onSelectLocation)}
        >
          <span className="action-icon">🎯</span>
          <span className="action-text">Set Transport Location</span>
          <span className="action-description">Show transport within 100m</span>
        </button>

        <button 
          className="pin-action-btn find-transport"
          onClick={() => handleAction('find-transport', onBookRide)}
        >
          <span className="action-icon">🚌</span>
          <span className="action-text">Find Transport</span>
          <span className="action-description">Bus, Train, Rideshare</span>
        </button>

        <button 
          className="pin-action-btn add-favorite"
          onClick={() => handleAction('add-favorite', onAddToFavorites)}
        >
          <span className="action-icon">⭐</span>
          <span className="action-text">Add to favorites</span>
          <span className="action-description">Save this location</span>
        </button>
      </div>

      <div className="pin-menu-footer">
        <div className="quick-actions">
          <button className="quick-action-btn">
            <span>🚌</span>
            <span>Bus stops</span>
          </button>
          <button className="quick-action-btn">
            <span>🚗</span>
            <span>Parking</span>
          </button>
          <button className="quick-action-btn">
            <span>☕</span>
            <span>Nearby</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default MapPinContextMenu;