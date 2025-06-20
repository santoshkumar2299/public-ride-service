import { useState, useEffect } from 'react';
import CompactLocationBar from './CompactLocationBar';
import MapView from './MapView';
import { config } from '../config/env';
import useDeviceDetection from '../hooks/useDeviceDetection';

function MapFirstView({ 
  onRideRequest, 
  onRideOffer,
  user,
  journeyData = null 
}) {
  const deviceInfo = useDeviceDetection();
  const [pickup, setPickup] = useState(
    journeyData?.pickup ? {
      lat: journeyData.pickup.coordinates[1],
      lng: journeyData.pickup.coordinates[0],
      address: journeyData.pickup.address
    } : null
  );
  
  const [destination, setDestination] = useState(
    journeyData?.destination ? {
      lat: journeyData.destination.coordinates[1],
      lng: journeyData.destination.coordinates[0],
      address: journeyData.destination.address
    } : null
  );

  const [showActions, setShowActions] = useState(false);
  const [actionSheetMinimized, setActionSheetMinimized] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [mapZoom, setMapZoom] = useState(12);

  // Auto-detect user's current location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log('Location detection failed:', error);
          // Fallback to default location
        },
        { timeout: 5000, enableHighAccuracy: false }
      );
    }
  }, []);

  // Show action buttons when both locations are selected
  useEffect(() => {
    if (pickup && destination) {
      setShowActions(true);
    } else {
      setShowActions(false);
      setActionSheetMinimized(false);
    }
  }, [pickup, destination]);

  const handleLocationSelect = (locationData) => {
    const location = {
      lat: locationData.lat,
      lng: locationData.lng,
      address: locationData.address
    };

    if (locationData.type === 'pickup') {
      setPickup(location);
    } else if (locationData.type === 'destination') {
      setDestination(location);
    }
  };

  const getMapCenter = () => {
    if (pickup && destination) {
      // Center between pickup and destination
      const centerLat = (pickup.lat + destination.lat) / 2;
      const centerLng = (pickup.lng + destination.lng) / 2;
      return [centerLat, centerLng];
    } else if (pickup) {
      return [pickup.lat, pickup.lng];
    } else if (destination) {
      return [destination.lat, destination.lng];
    } else if (userLocation) {
      return [userLocation.lat, userLocation.lng];
    }
    return [config.defaultMapCenter.lat, config.defaultMapCenter.lng];
  };

  const getMapBounds = () => {
    // Disable auto bounds when user is manually controlling zoom
    return null;
  };

  const getMapZoom = () => {
    // If user has manually zoomed, use that
    if (mapZoom !== 12) {
      return mapZoom;
    }
    
    // Auto-zoom based on content
    if (pickup && destination) {
      return 13; // Medium zoom for route view
    } else if (pickup || destination) {
      return 15; // High zoom for single location
    } else if (userLocation) {
      return 14; // Medium-high zoom for user location
    }
    return 12; // Default zoom
  };

  const getMapMarkers = () => {
    const markers = [];
    
    if (pickup) {
      markers.push({
        latitude: pickup.lat,
        longitude: pickup.lng,
        title: "Pickup Location",
        icon: '🚶',
        color: '#007bff'
      });
    }
    
    if (destination) {
      markers.push({
        latitude: destination.lat,
        longitude: destination.lng,
        title: "Destination",
        icon: '🎯',
        color: '#28a745'
      });
    }
    
    // Show user location if no pickup/destination selected
    if (!pickup && !destination && userLocation) {
      markers.push({
        latitude: userLocation.lat,
        longitude: userLocation.lng,
        title: "Your Location",
        icon: '📍',
        color: '#6c757d'
      });
    }
    
    return markers;
  };

  const getRoutes = () => {
    if (pickup && destination) {
      return [{
        start: { lat: pickup.lat, lng: pickup.lng },
        end: { lat: destination.lat, lng: destination.lng },
        color: "#007bff",
        weight: 4,
        title: "Your Route"
      }];
    }
    return [];
  };

  const calculateDistance = () => {
    if (!pickup || !destination) return null;
    
    const R = 6371; // Earth's radius in kilometers
    const dLat = (destination.lat - pickup.lat) * Math.PI / 180;
    const dLon = (destination.lng - pickup.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(pickup.lat * Math.PI / 180) * Math.cos(destination.lat * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return {
      distance: distance.toFixed(1),
      time: Math.round((distance / 30) * 60) // Estimate: 30km/h average
    };
  };

  const routeInfo = calculateDistance();

  const handleRequestRide = () => {
    console.log('Request ride clicked - calling onRideRequest');
    if (onRideRequest) {
      onRideRequest('request', {
        pickup: pickup || { lat: 40.7128, lng: -74.0060, address: "Test Pickup" },
        destination: destination || { lat: 40.7589, lng: -73.9851, address: "Test Destination" },
        routeInfo: routeInfo || { distance: "5.0", time: 15 }
      });
    }
  };

  const handleOfferRide = () => {
    console.log('Offer ride clicked - calling onRideOffer');
    if (onRideOffer) {
      onRideOffer('offer', {
        pickup: pickup || { lat: 40.7128, lng: -74.0060, address: "Test Pickup" },
        destination: destination || { lat: 40.7589, lng: -73.9851, address: "Test Destination" },
        routeInfo: routeInfo || { distance: "5.0", time: 15 }
      });
    }
  };

  const handleZoomIn = () => {
    setMapZoom(prev => Math.min(prev + 1, 18)); // Max zoom 18
  };

  const handleZoomOut = () => {
    setMapZoom(prev => Math.max(prev - 1, 3)); // Min zoom 3
  };

  const handleMapZoomChange = (newZoom) => {
    setMapZoom(newZoom);
  };

  // Simple layout for now (debugging)
  return (
    <div className="map-first-view">
      {/* Floating Location Bar */}
      <div className="floating-location-container">
        <CompactLocationBar
          pickup={pickup}
          destination={destination}
          onLocationSelect={handleLocationSelect}
          referenceLocation={pickup || destination}
          user={user}
        />
        
      </div>

      {/* Full Screen Map */}
      <div className="map-container-fullscreen">
        <MapView
          center={getMapCenter()}
          zoom={getMapZoom()}
          markers={getMapMarkers()}
          routes={getRoutes()}
          bounds={getMapBounds()}
          height="100%"
          showControls={false}
          onZoomChange={handleMapZoomChange}
        />
      </div>
      
      {/* Map Zoom Controls - Right bottom corner */}
      <div style={{
        position: 'absolute',
        bottom: '100px',
        right: '24px',
        zIndex: 1500,
        background: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.1)',
        border: '1px solid #dee2e6',
        overflow: 'hidden'
      }}>
        <button 
          onClick={(e) => {
            e.preventDefault();
            console.log('Zoom In clicked, current zoom:', mapZoom);
            handleZoomIn();
          }}
          style={{
            width: '44px',
            height: '44px',
            fontSize: '18px',
            fontWeight: '600',
            backgroundColor: 'transparent',
            border: 'none',
            borderBottom: '1px solid #dee2e6',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#333333',
            transition: 'all 0.2s ease',
            outline: 'none'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#f8f9fa';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'transparent';
          }}
          onMouseDown={(e) => {
            e.target.style.backgroundColor = '#e9ecef';
            e.target.style.transform = 'scale(0.95)';
          }}
          onMouseUp={(e) => {
            e.target.style.backgroundColor = '#f8f9fa';
            e.target.style.transform = 'scale(1)';
          }}
          onFocus={(e) => {
            e.target.style.boxShadow = '0 0 0 2px rgba(0, 123, 255, 0.25)';
          }}
          onBlur={(e) => {
            e.target.style.boxShadow = 'none';
          }}
          title="Zoom In"
        >
          +
        </button>
        <button 
          onClick={(e) => {
            e.preventDefault();
            console.log('Zoom Out clicked, current zoom:', mapZoom);
            handleZoomOut();
          }}
          style={{
            width: '44px',
            height: '44px',
            fontSize: '18px',
            fontWeight: '600',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#333333',
            transition: 'all 0.2s ease',
            outline: 'none'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#f8f9fa';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'transparent';
          }}
          onMouseDown={(e) => {
            e.target.style.backgroundColor = '#e9ecef';
            e.target.style.transform = 'scale(0.95)';
          }}
          onMouseUp={(e) => {
            e.target.style.backgroundColor = '#f8f9fa';
            e.target.style.transform = 'scale(1)';
          }}
          onFocus={(e) => {
            e.target.style.boxShadow = '0 0 0 2px rgba(0, 123, 255, 0.25)';
          }}
          onBlur={(e) => {
            e.target.style.boxShadow = 'none';
          }}
          title="Zoom Out"
        >
          −
        </button>
      </div>

      {/* Compact Action Sheet - Always visible for testing */}
      {true && (
        <div className="compact-action-sheet">
          <div className="compact-header">
            <div className="route-info-compact">
              <span className="route-text">
                {routeInfo ? `${routeInfo.distance} km • ${routeInfo.time} min` : 'Choose your ride'}
              </span>
            </div>
          </div>
          
          <div className="compact-ride-options">
            {onRideRequest && (
              <button 
                className="compact-ride-btn passenger-compact"
                onClick={handleRequestRide}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                <span>Request Ride</span>
              </button>
            )}
            
            {onRideOffer && (
              <button 
                className="compact-ride-btn driver-compact"
                onClick={handleOfferRide}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L18 10V6c0-2-2-4-4-4H4c-2 0-4 2-4 4v5h2a3 3 0 0 0 6 0h2a3 3 0 0 0 6 0Z"/>
                  <circle cx="7" cy="17" r="2"/>
                  <path d="M9 17h6"/>
                  <circle cx="17" cy="17" r="2"/>
                </svg>
                <span>Offer Ride</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );

  // Mobile Layout (unchanged)  
  if (false && deviceInfo.isMobile) {
    return (
      <div className="map-first-view mobile">
        {/* Floating Location Bar */}
        <div className="floating-location-container">
          <CompactLocationBar
            pickup={pickup}
            destination={destination}
            onLocationSelect={handleLocationSelect}
            referenceLocation={pickup || destination}
            user={user}
          />
          
          {/* Route Info */}
          {routeInfo && (
            <div className="route-info-compact">
              <span className="route-distance">📏 {routeInfo.distance} km</span>
              <span className="route-time">⏱️ ~{routeInfo.time} min</span>
            </div>
          )}
        </div>

        {/* Full Screen Map */}
        <div className="map-container-fullscreen">
          <MapView
            center={getMapCenter()}
            zoom={getMapZoom()}
            markers={getMapMarkers()}
            routes={getRoutes()}
            bounds={getMapBounds()}
            height="100%"
            showControls={false}
            onZoomChange={handleMapZoomChange}
          />
        </div>
        
        {/* Map Zoom Controls - Outside map container */}
        <div className="map-zoom-controls">
          <button 
            className="zoom-btn zoom-in"
            onClick={handleZoomIn}
            title="Zoom In"
          >
            +
          </button>
          <button 
            className="zoom-btn zoom-out"
            onClick={handleZoomOut}
            title="Zoom Out"
          >
            -
          </button>
        </div>

        {/* Compact Action Sheet */}
        {showActions && (
          <div className="compact-action-sheet">
            <div className="compact-header">
              <div className="route-info-compact">
                <span className="route-text">
                  {routeInfo ? `${routeInfo.distance} km • ${routeInfo.time} min` : 'Choose your ride'}
                </span>
              </div>
            </div>
            
            <div className="compact-ride-options">
              {onRideRequest && (
                <button 
                  className="compact-ride-btn passenger-compact"
                  onClick={handleRequestRide}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  <span>Request Ride</span>
                </button>
              )}
              
              {onRideOffer && (
                <button 
                  className="compact-ride-btn driver-compact"
                  onClick={handleOfferRide}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L18 10V6c0-2-2-4-4-4H4c-2 0-4 2-4 4v5h2a3 3 0 0 0 6 0h2a3 3 0 0 0 6 0Z"/>
                    <circle cx="7" cy="17" r="2"/>
                    <path d="M9 17h6"/>
                    <circle cx="17" cy="17" r="2"/>
                  </svg>
                  <span>Offer Ride</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Desktop Layout - Full width map with floating compact search
  return (
    <div className="map-first-view desktop">
      {/* Floating Compact Location Boxes */}
      <div className="desktop-floating-search">
        <CompactLocationBar
          pickup={pickup}
          destination={destination}
          onLocationSelect={handleLocationSelect}
          referenceLocation={pickup || destination}
          user={user}
        />
        
        {/* Route Info */}
        {routeInfo && (
          <div className="route-info-compact desktop">
            <span className="route-distance">📏 {routeInfo.distance} km</span>
            <span className="route-time">⏱️ ~{routeInfo.time} min</span>
          </div>
        )}
      </div>

      {/* Full Browser Width Map */}
      <div className="desktop-map-fullwidth">
        <MapView
          center={getMapCenter()}
          zoom={getMapZoom()}
          markers={getMapMarkers()}
          routes={getRoutes()}
          bounds={getMapBounds()}
          height="100%"
          showControls={false}
          onZoomChange={handleMapZoomChange}
        />
      </div>
      
      {/* Map Zoom Controls - Outside map container */}
      <div className="map-zoom-controls">
        <button 
          className="zoom-btn zoom-in"
          onClick={handleZoomIn}
          title="Zoom In"
        >
          +
        </button>
        <button 
          className="zoom-btn zoom-out"
          onClick={handleZoomOut}
          title="Zoom Out"
        >
          -
        </button>
      </div>

      {/* Compact Action Sheet for Desktop */}
      {showActions && (
        <div className="desktop-action-sheet">
          <div className="compact-header">
            <div className="route-info-compact">
              <span className="route-text">
                {routeInfo ? `${routeInfo.distance} km • ${routeInfo.time} min` : 'Choose your ride'}
              </span>
            </div>
          </div>
          
          <div className="compact-ride-options">
            {onRideRequest && (
              <button 
                className="compact-ride-btn passenger-compact"
                onClick={handleRequestRide}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                <span>Request Ride</span>
              </button>
            )}
            
            {onRideOffer && (
              <button 
                className="compact-ride-btn driver-compact"
                onClick={handleOfferRide}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L18 10V6c0-2-2-4-4-4H4c-2 0-4 2-4 4v5h2a3 3 0 0 0 6 0h2a3 3 0 0 0 6 0Z"/>
                  <circle cx="7" cy="17" r="2"/>
                  <path d="M9 17h6"/>
                  <circle cx="17" cy="17" r="2"/>
                </svg>
                <span>Offer Ride</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default MapFirstView;