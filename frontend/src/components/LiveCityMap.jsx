import { useState, useEffect, useRef } from 'react';
import MapView from './MapView';
import MapWithPinning from './MapWithPinning';
import PrioritySelector from './PrioritySelector';
// EmergencyTransportModal removed - now using EmergencyFloatingCard in ContextualFAB
import ShareRideModal from './scenarios/ShareRideModal';
// SpotTransportModal removed - now using FloatingCard in ContextualFAB
import ExploreOptionsModal from './scenarios/ExploreOptionsModal';
import CommunityHelpModal from './scenarios/CommunityHelpModal';
import QuickTravelModal from './QuickTravelModal';
import CommunityTransportModal from './RideBookingModal';
import InlineToolsDemo from './inline-tools/InlineToolsDemo';
import { config } from '../config/env';

function LiveCityMap({ 
  user, 
  activeScenario, 
  onScenarioSelect, 
  onScenarioComplete,
  onRideRequest,
  onRideOffer,
  journeyData 
}) {
  const [userLocation, setUserLocation] = useState(null);
  const [liveTransport, setLiveTransport] = useState([]);
  const [mapCenter, setMapCenter] = useState([config.defaultMapCenter.lat, config.defaultMapCenter.lng]);
  const [mapZoom, setMapZoom] = useState(14); // Good initial zoom level
  const [selectedLocation, setSelectedLocation] = useState(null); // For 100m transport filtering
  const [currentCity, setCurrentCity] = useState(null);
  const [isDetectingCity, setIsDetectingCity] = useState(false);
  const [viewportCity, setViewportCity] = useState(null);
  const [isDetectingViewport, setIsDetectingViewport] = useState(false);
  const [viewportCenter, setViewportCenter] = useState(null);
  const [showQuickTravelModal, setShowQuickTravelModal] = useState(false);
  const [editLocationCoords, setEditLocationCoords] = useState(null);
  const [showRideBookingModal, setShowRideBookingModal] = useState(false);
  const [rideDestination, setRideDestination] = useState(null);
  
  
  // Map pinning state
  const [mapPinningMode, setMapPinningMode] = useState(null); // null, 'spot-transport', etc.
  const [pendingPinCallback, setPendingPinCallback] = useState(null);
  
  // Persistent state for SpotTransportModal - removed (now using FloatingCard)

  // Function to reverse geocode and extract city name with fallbacks
  const detectCityName = async (lat, lng) => {
    setIsDetectingCity(true);
    try {
      // Try multiple geocoding methods in order
      const city = await tryGeocoding(lat, lng) || 
                   getCityFromCoordinates(lat, lng) || 
                   'Unknown Location';
      
      if (city && city !== 'Unknown Location') {
        setCurrentCity(city);
      }
    } catch (error) {
      console.error('City detection error:', error);
      // Fallback to coordinate-based city detection
      const fallbackCity = getCityFromCoordinates(lat, lng);
      if (fallbackCity) {
        setCurrentCity(fallbackCity);
      }
    } finally {
      setIsDetectingCity(false);
    }
  };

  // Try different geocoding APIs with timeouts
  const tryGeocoding = async (lat, lng) => {
    const methods = [
      () => tryNominatim(lat, lng),
      () => tryBackendGeocoding(lat, lng)
    ];

    for (const method of methods) {
      try {
        const result = await Promise.race([
          method(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
        ]);
        if (result) return result;
      } catch (error) {
        console.warn('Geocoding method failed:', error.message);
        continue;
      }
    }
    return null;
  };

  // Try Nominatim with better error handling
  const tryNominatim = async (lat, lng) => {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?` + 
      new URLSearchParams({
        lat: lat.toString(),
        lon: lng.toString(),
        format: 'json',
        addressdetails: '1',
        'accept-language': 'en'
      }),
      {
        headers: {
          'User-Agent': 'SpotTransport/1.0',
          'Referer': window.location.origin
        },
        mode: 'cors'
      }
    );

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    const address = data.address || {};
    
    return address.city || 
           address.town || 
           address.village || 
           address.municipality ||
           address.county ||
           address.state_district ||
           address.state ||
           null;
  };

  // Try backend geocoding (if available)
  const tryBackendGeocoding = async (lat, lng) => {
    try {
      const response = await fetch(`/api/geocode/reverse?lat=${lat}&lng=${lng}`);
      if (response.ok) {
        const data = await response.json();
        return data.city || data.locality;
      }
    } catch (error) {
      // Backend geocoding not available
      return null;
    }
  };

  // Fallback: Approximate city from coordinates (major Indian cities)
  const getCityFromCoordinates = (lat, lng) => {
    const cities = [
      { name: 'Hyderabad', lat: 17.4435, lng: 78.3772, radius: 0.5 },
      { name: 'Bangalore', lat: 12.9716, lng: 77.5946, radius: 0.5 },
      { name: 'Chennai', lat: 13.0827, lng: 80.2707, radius: 0.5 },
      { name: 'Mumbai', lat: 19.0760, lng: 72.8777, radius: 0.5 },
      { name: 'Delhi', lat: 28.7041, lng: 77.1025, radius: 0.5 },
      { name: 'Kolkata', lat: 22.5726, lng: 88.3639, radius: 0.5 },
      { name: 'Pune', lat: 18.5204, lng: 73.8567, radius: 0.3 }
    ];

    for (const city of cities) {
      const distance = Math.sqrt(
        Math.pow(lat - city.lat, 2) + Math.pow(lng - city.lng, 2)
      );
      if (distance <= city.radius) {
        return city.name;
      }
    }
    
    // Return general region if no specific city match
    if (lat >= 10 && lat <= 20 && lng >= 75 && lng <= 85) return 'South India';
    if (lat >= 20 && lat <= 30 && lng >= 70 && lng <= 85) return 'North India';
    if (lat >= 15 && lat <= 25 && lng >= 68 && lng <= 78) return 'West India';
    if (lat >= 20 && lat <= 30 && lng >= 85 && lng <= 95) return 'East India';
    
    return 'India';
  };

  // Function to detect city in current map viewport
  const detectViewportCity = async (lat, lng) => {
    setIsDetectingViewport(true);
    try {
      // Use the same robust geocoding system
      const city = await tryGeocoding(lat, lng) || 
                   getCityFromCoordinates(lat, lng) || 
                   null;
      
      if (city && city !== 'Unknown Location' && city !== viewportCity) {
        setViewportCity(city);
      }
    } catch (error) {
      console.error('Viewport city detection error:', error);
      // Fallback to coordinate-based detection
      const fallbackCity = getCityFromCoordinates(lat, lng);
      if (fallbackCity && fallbackCity !== viewportCity) {
        setViewportCity(fallbackCity);
      }
    } finally {
      setIsDetectingViewport(false);
    }
  };

  // Debounced viewport city detection
  useEffect(() => {
    let timeoutId;
    
    const debouncedDetectViewport = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        detectViewportCity(viewportCenter[0], viewportCenter[1]);
      }, 1000); // Wait 1 second after user stops moving
    };

    // Only detect if viewport center has changed
    if (viewportCenter && viewportCenter[0] && viewportCenter[1]) {
      debouncedDetectViewport();
    }

    return () => clearTimeout(timeoutId);
  }, [viewportCenter, viewportCity]);

  // Map pinning event listener
  useEffect(() => {
    const handleMapPinRequest = (event) => {
      const { purpose, callback } = event.detail;
      console.log('🎯 Map pinning requested for:', purpose);
      
      setMapPinningMode(purpose);
      setPendingPinCallback(() => callback);
      
      // Show visual feedback that map is in pinning mode
      document.body.style.cursor = 'crosshair';
    };

    const handleReopenSpotTransport = () => {
      // Reopen spot transport modal with preserved data
      console.log('🔄 Reopening SpotTransport with preserved data');
      if (onScenarioSelect) {
        onScenarioSelect('spot_transport');
      }
    };

    window.addEventListener('requestMapPinning', handleMapPinRequest);
    window.addEventListener('reopenSpotTransport', handleReopenSpotTransport);
    
    return () => {
      window.removeEventListener('requestMapPinning', handleMapPinRequest);
      window.removeEventListener('reopenSpotTransport', handleReopenSpotTransport);
      document.body.style.cursor = 'default';
    };
  }, [onScenarioSelect]);


  // Auto-detect user location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(location);
          setMapCenter([location.lat, location.lng]);
          setMapZoom(15); // Good zoom for local area
          
          // Set selected location for 100m transport filtering (anchored)
          setSelectedLocation(location);
          
          // Detect city name for user location
          detectCityName(location.lat, location.lng);
          
          // Location detected - ready for scenario-based interactions
        },
        (error) => {
          console.log('Location detection failed:', error);
          // Fallback to default location - also detect city name for default location
          const defaultLocation = { lat: config.defaultMapCenter.lat, lng: config.defaultMapCenter.lng };
          setMapCenter([defaultLocation.lat, defaultLocation.lng]);
          setMapZoom(15);
          
          // Set selected location for 100m transport filtering (anchored)
          setSelectedLocation(defaultLocation);
          
          detectCityName(config.defaultMapCenter.lat, config.defaultMapCenter.lng);
        },
        { timeout: 5000, enableHighAccuracy: false }
      );
    } else {
      // No geolocation support - use default location and detect city name
      const defaultLocation = { lat: config.defaultMapCenter.lat, lng: config.defaultMapCenter.lng };
      setMapCenter([defaultLocation.lat, defaultLocation.lng]);
      setMapZoom(15);
      
      // Set selected location for 100m transport filtering (anchored)
      setSelectedLocation(defaultLocation);
      
      detectCityName(config.defaultMapCenter.lat, config.defaultMapCenter.lng);
    }
  }, []);

  // Helper function to calculate distance between two points in meters
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lng2-lng1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  };

  // Helper function to calculate bounds for a radius in meters
  const calculateRadiusBounds = (centerLat, centerLng, radiusMeters) => {
    const radiusInDegrees = radiusMeters / 111320; // Approximate conversion: 1 degree ≈ 111.32 km
    
    const bounds = {
      north: centerLat + radiusInDegrees,
      south: centerLat - radiusInDegrees,
      east: centerLng + radiusInDegrees,
      west: centerLng - radiusInDegrees
    };
    
    console.log(`Calculated ${radiusMeters}m bounds for center ${centerLat}, ${centerLng}:`, bounds);
    return bounds;
  };

  // Simulate live transport data
  useEffect(() => {
    const generateLiveTransport = () => {
      const center = selectedLocation || userLocation || { lat: config.defaultMapCenter.lat, lng: config.defaultMapCenter.lng };
      const transports = [];
      
      // Generate transport options within 100m radius directly
      for (let i = 0; i < 20; i++) {
        // Generate within 100m radius using proper distance calculation
        const angle = Math.random() * 2 * Math.PI;
        const radius = Math.random() * 100; // 0-100 meters
        const offsetLat = (radius * Math.cos(angle)) / 111320; // Convert meters to degrees
        const offsetLng = (radius * Math.sin(angle)) / (111320 * Math.cos(center.lat * Math.PI / 180));
        transports.push({
          id: `bus-${i}`,
          type: 'bus',
          lat: center.lat + offsetLat,
          lng: center.lng + offsetLng,
          icon: '🚌',
          route: `${Math.floor(Math.random() * 200) + 1}`,
          status: 'moving',
          passengers: Math.floor(Math.random() * 50) + 10
        });
      }
      
      // Generate ride shares within 100m radius
      for (let i = 0; i < 10; i++) {
        const angle = Math.random() * 2 * Math.PI;
        const radius = Math.random() * 100; // 0-100 meters
        const offsetLat = (radius * Math.cos(angle)) / 111320;
        const offsetLng = (radius * Math.sin(angle)) / (111320 * Math.cos(center.lat * Math.PI / 180));
        transports.push({
          id: `ride-${i}`,
          type: 'ride',
          lat: center.lat + offsetLat,
          lng: center.lng + offsetLng,
          icon: '🚗',
          driver: `Driver ${i + 1}`,
          status: 'available',
          rating: (4 + Math.random()).toFixed(1)
        });
      }
      
      // Generate auto-rickshaws within 100m radius
      for (let i = 0; i < 15; i++) {
        const angle = Math.random() * 2 * Math.PI;
        const radius = Math.random() * 100; // 0-100 meters
        const offsetLat = (radius * Math.cos(angle)) / 111320;
        const offsetLng = (radius * Math.sin(angle)) / (111320 * Math.cos(center.lat * Math.PI / 180));
        transports.push({
          id: `auto-${i}`,
          type: 'auto',
          lat: center.lat + offsetLat,
          lng: center.lng + offsetLng,
          icon: '🛺',
          driver: `Auto ${i + 1}`,
          status: 'available',
          fare: `₹${Math.floor(Math.random() * 50) + 20}`
        });
      }
      
      // All transports are already generated within 100m, so no filtering needed
      setLiveTransport(transports);
      
      console.log(`Generated ${transports.length} vehicles within 100m of`, center);
    };

    generateLiveTransport();
    
    // Update transport positions every 10 seconds, ensuring they stay within 100m radius
    const interval = setInterval(() => {
      const center = selectedLocation || userLocation || { lat: config.defaultMapCenter.lat, lng: config.defaultMapCenter.lng };
      
      setLiveTransport(prev => prev.map(transport => {
        // Calculate small movement
        const newLat = transport.lat + (Math.random() - 0.5) * 0.001; // Small movement
        const newLng = transport.lng + (Math.random() - 0.5) * 0.001;
        
        // Check if new position is still within 100m of center
        const distance = calculateDistance(center.lat, center.lng, newLat, newLng);
        
        if (distance <= 100) {
          // Movement is within bounds, use new position
          return {
            ...transport,
            lat: newLat,
            lng: newLng
          };
        } else {
          // Movement would exceed bounds, keep current position or move towards center
          const moveTowardCenter = 0.1; // 10% movement towards center
          return {
            ...transport,
            lat: transport.lat + (center.lat - transport.lat) * moveTowardCenter,
            lng: transport.lng + (center.lng - transport.lng) * moveTowardCenter
          };
        }
      }));
    }, 10000);

    return () => clearInterval(interval);
  }, [selectedLocation, userLocation]);

  // Phase 4: Scenario-based interactions replace priority selection

  const getMapMarkers = () => {
    const markers = [];
    
    // User location marker
    if (userLocation) {
      markers.push({
        latitude: userLocation.lat,
        longitude: userLocation.lng,
        title: "You are here",
        icon: '📍',
        color: '#007bff'
      });
    }
    
    // Transport markers
    liveTransport.forEach(transport => {
      markers.push({
        latitude: transport.lat,
        longitude: transport.lng,
        title: `${transport.icon} ${transport.route || transport.driver || transport.type}`,
        icon: transport.icon,
        color: transport.highlighted ? '#28a745' : '#6c757d',
        description: transport.status
      });
    });
    
    return markers;
  };

  const handleTransportClick = (transport) => {
    if (onTransportSelect) {
      onTransportSelect(transport);
    }
  };

  // Pin context menu handlers
  const handleGoToLocation = (coordinates) => {
    console.log('Navigate to:', coordinates);
    // Trigger emergency transport modal with destination set
    if (onScenarioSelect) {
      onScenarioSelect('emergency_transport', { destination: coordinates });
    }
  };

  const handleStartFromLocation = (coordinates) => {
    console.log('Start journey from:', coordinates);
    // Set this as the origin for future route planning
  };

  const handleFindRoute = (coordinates) => {
    console.log('Find route to:', coordinates);
    // Open explore options modal with this destination
    if (onScenarioSelect) {
      onScenarioSelect('explore_options', { destination: coordinates });
    }
  };

  const handleAddToFavorites = (coordinates) => {
    console.log('Add to favorites:', coordinates);
    // Add to user's saved locations
  };

  // Handle map movement to update center coordinates
  const handleMapMove = (center) => {
    // Store viewport center separately to avoid interfering with map interactions
    setViewportCenter([center.lat, center.lng]);
  };

  // Handle edit location from pin context menu
  const handleEditLocation = (coordinates) => {
    setEditLocationCoords(coordinates);
    setShowQuickTravelModal(true);
  };

  // Handle selecting a new location for transport filtering
  const handleSelectLocation = (coordinates) => {
    console.log('🎯 Setting new transport anchor point:', coordinates);
    setSelectedLocation({ lat: coordinates.lat, lng: coordinates.lng });
    
    // Optional: Center map on new transport location for user feedback
    setMapCenter([coordinates.lat, coordinates.lng]);
    
    // Transport data will be regenerated due to useEffect dependency
    console.log('✅ Transport data will now show within 100m of this location, regardless of map panning');
  };

  // Handle travel to selected location
  const handleTravelTo = (location) => {
    console.log('Traveling to:', location);
    // Update map center to travel to the location
    setMapCenter([location.lat, location.lng]);
    setMapZoom(14); // Zoom in to the new location
    
    // Update city detection for the new location
    detectViewportCity(location.lat, location.lng);
    
    // Close modal
    setShowQuickTravelModal(false);
    setEditLocationCoords(null);
  };

  // Handle book ride from pin context menu
  const handleBookRide = (coordinates) => {
    setRideDestination(coordinates);
    setShowRideBookingModal(true);
  };

  // Handle map pin placement for spot transport
  const handleMapPin = async (latLng) => {
    if (!mapPinningMode || !pendingPinCallback) {
      return; // Not in pinning mode
    }

    console.log('📍 Map pin placed:', latLng);

    try {
      // Reverse geocode the pinned location
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?` + 
        new URLSearchParams({
          lat: latLng.lat.toString(),
          lon: latLng.lng.toString(),
          format: 'json',
          addressdetails: '1',
          'accept-language': 'en'
        })
      );

      let locationData = {
        lat: latLng.lat,
        lng: latLng.lng,
        source: 'map-pin',
        display_name: `${latLng.lat.toFixed(6)}, ${latLng.lng.toFixed(6)}`,
        name: 'Pinned Location'
      };

      if (response.ok) {
        const data = await response.json();
        locationData.display_name = data.display_name;
        locationData.name = data.name || data.display_name.split(',')[0];
      }

      // Call the callback with the location data
      if (pendingPinCallback) {
        pendingPinCallback(locationData);
      }

      // Exit pinning mode
      setMapPinningMode(null);
      setPendingPinCallback(null);
      document.body.style.cursor = 'default';

      // Reopen the relevant modal based on purpose
      if (mapPinningMode === 'spot-transport') {
        onScenarioSelect('spot_transport');
      }

    } catch (error) {
      console.error('❌ Failed to geocode pinned location:', error);
      
      // Still call callback with basic location data
      if (pendingPinCallback) {
        pendingPinCallback({
          lat: latLng.lat,
          lng: latLng.lng,
          source: 'map-pin',
          display_name: `${latLng.lat.toFixed(6)}, ${latLng.lng.toFixed(6)}`,
          name: 'Pinned Location'
        });
      }

      // Exit pinning mode
      setMapPinningMode(null);
      setPendingPinCallback(null);
      document.body.style.cursor = 'default';

      if (mapPinningMode === 'spot-transport') {
        onScenarioSelect('spot_transport');
      }
    }
  };

  return (
    <div className="interactive-city-map">
      {/* Full Screen Map with Pinning */}
      <div className="city-map-container">
        <MapWithPinning
          center={mapCenter}
          zoom={mapZoom}
          markers={getMapMarkers()}
          height="100vh"
          showControls={true}
          onGoToLocation={handleGoToLocation}
          onStartFromLocation={handleStartFromLocation}
          onFindRouteToLocation={handleFindRoute}
          onAddToFavorites={handleAddToFavorites}
          onMapMove={handleMapMove}
          onEditLocation={handleEditLocation}
          onBookRide={handleBookRide}
          onMapPin={handleMapPin}
          mapPinningMode={mapPinningMode}
          onSelectLocation={handleSelectLocation}
          transportAnchor={selectedLocation}
          showTransportArea={true}
        />
      </div>
      
      {/* UI Overlay Container - Unified Layout System */}
      <div className="map-ui-overlay">
        {/* Top UI Section */}
        <div className="map-ui-top">
          <div className="location-status">
            <div className="status-card">
              <span className="status-icon">📍</span>
              <span className="status-text">
                {isDetectingViewport ? "Detecting city..." :
                 isDetectingCity ? "Detecting location..." : 
                 viewportCity ? `Exploring ${viewportCity}` :
                 userLocation ? 
                   (currentCity ? `Exploring ${currentCity}` : "Location detected") : 
                   (currentCity ? `Exploring ${currentCity}` : "Using default location")
                }
              </span>
            </div>
          </div>
          
        </div>
        
        {/* Bottom UI Section */}
        <div className="map-ui-bottom">
          <div className="transport-stats">
            <div className="stats-card">
              <div className="stat-item">
                <span className="stat-icon">🚌</span>
                <span className="stat-count">{liveTransport.filter(t => t.type === 'bus').length}</span>
              </div>
              <div className="stat-item">
                <span className="stat-icon">🚗</span>
                <span className="stat-count">{liveTransport.filter(t => t.type === 'ride').length}</span>
              </div>
              <div className="stat-item">
                <span className="stat-icon">🛺</span>
                <span className="stat-count">{liveTransport.filter(t => t.type === 'auto').length}</span>
              </div>
            </div>
          </div>
          
        </div>
      </div>



      {/* ContextualFAB now rendered at App level for global visibility */}

      {/* Scenario Modals */}
      {/* Emergency Transport now handled by EmergencyFloatingCard in ContextualFAB */}
      
      {activeScenario === 'share_ride' && (
        <ShareRideModal
          userLocation={userLocation}
          onClose={onScenarioComplete}
        />
      )}
      
      {/* Spot Transport now handled by FloatingCard in ContextualFAB */}
      
      {activeScenario === 'explore_options' && (
        <ExploreOptionsModal
          userLocation={userLocation}
          onClose={onScenarioComplete}
        />
      )}
      
      {activeScenario === 'community_help' && (
        <CommunityHelpModal
          userLocation={userLocation}
          onClose={onScenarioComplete}
        />
      )}

      {/* Quick Travel Modal */}
      <QuickTravelModal
        isVisible={showQuickTravelModal}
        onClose={() => {
          setShowQuickTravelModal(false);
          setEditLocationCoords(null);
        }}
        onTravelTo={handleTravelTo}
        currentLocation={editLocationCoords}
      />

      {/* Community Transport Modal */}
      <CommunityTransportModal
        isVisible={showRideBookingModal}
        onClose={() => {
          setShowRideBookingModal(false);
          setRideDestination(null);
        }}
        destination={rideDestination}
        userLocation={userLocation}
      />

      {/* Inline Tools Demo - Removed: FloatingCard now integrated in main FAB
      <InlineToolsDemo 
        userLocation={userLocation}
      />
      */}
    </div>
  );
}

export default LiveCityMap;