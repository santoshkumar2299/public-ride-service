import { useState, useEffect } from 'react';
import MapView from './MapView';
import MapWithPinning from './MapWithPinning';
import PrioritySelector from './PrioritySelector';
import ContextualFAB from './ContextualFAB';
import EmergencyTransportModal from './scenarios/EmergencyTransportModal';
import ShareRideModal from './scenarios/ShareRideModal';
import SpotTransportModal from './scenarios/SpotTransportModal';
import ExploreOptionsModal from './scenarios/ExploreOptionsModal';
import CommunityHelpModal from './scenarios/CommunityHelpModal';
import QuickTravelModal from './QuickTravelModal';
import CommunityTransportModal from './RideBookingModal';
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
  const [mapZoom, setMapZoom] = useState(12);
  const [currentCity, setCurrentCity] = useState(null);
  const [isDetectingCity, setIsDetectingCity] = useState(false);
  const [viewportCity, setViewportCity] = useState(null);
  const [isDetectingViewport, setIsDetectingViewport] = useState(false);
  const [viewportCenter, setViewportCenter] = useState(null);
  const [showQuickTravelModal, setShowQuickTravelModal] = useState(false);
  const [editLocationCoords, setEditLocationCoords] = useState(null);
  const [showRideBookingModal, setShowRideBookingModal] = useState(false);
  const [rideDestination, setRideDestination] = useState(null);

  // Function to reverse geocode and extract city name
  const detectCityName = async (lat, lng) => {
    setIsDetectingCity(true);
    try {
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
            'User-Agent': 'RideShareMVP/1.0'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        const address = data.address || {};
        
        // Extract city name from address components
        const city = address.city || 
                    address.town || 
                    address.village || 
                    address.municipality ||
                    address.county ||
                    address.state_district ||
                    address.state ||
                    null;
        
        if (city) {
          setCurrentCity(city);
        }
      }
    } catch (error) {
      console.error('City detection error:', error);
    } finally {
      setIsDetectingCity(false);
    }
  };

  // Function to detect city in current map viewport
  const detectViewportCity = async (lat, lng) => {
    setIsDetectingViewport(true);
    try {
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
            'User-Agent': 'RideShareMVP/1.0'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        const address = data.address || {};
        
        // Extract city name from address components
        const city = address.city || 
                    address.town || 
                    address.village || 
                    address.municipality ||
                    address.county ||
                    address.state_district ||
                    address.state ||
                    null;
        
        if (city && city !== viewportCity) {
          setViewportCity(city);
        }
      }
    } catch (error) {
      console.error('Viewport city detection error:', error);
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
          setMapZoom(14);
          
          // Detect city name for user location
          detectCityName(location.lat, location.lng);
          
          // Location detected - ready for scenario-based interactions
        },
        (error) => {
          console.log('Location detection failed:', error);
          // Fallback to default location - also detect city name for default location
          detectCityName(config.defaultMapCenter.lat, config.defaultMapCenter.lng);
        },
        { timeout: 5000, enableHighAccuracy: false }
      );
    } else {
      // No geolocation support - use default location and detect city name
      detectCityName(config.defaultMapCenter.lat, config.defaultMapCenter.lng);
    }
  }, []);

  // Simulate live transport data
  useEffect(() => {
    const generateLiveTransport = () => {
      const center = userLocation || { lat: config.defaultMapCenter.lat, lng: config.defaultMapCenter.lng };
      const transports = [];
      
      // Generate random buses
      for (let i = 0; i < 8; i++) {
        const offsetLat = (Math.random() - 0.5) * 0.02; // ~1km radius
        const offsetLng = (Math.random() - 0.5) * 0.02;
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
      
      // Generate available ride shares
      for (let i = 0; i < 5; i++) {
        const offsetLat = (Math.random() - 0.5) * 0.015;
        const offsetLng = (Math.random() - 0.5) * 0.015;
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
      
      // Generate auto-rickshaws
      for (let i = 0; i < 6; i++) {
        const offsetLat = (Math.random() - 0.5) * 0.01;
        const offsetLng = (Math.random() - 0.5) * 0.01;
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
      
      setLiveTransport(transports);
    };

    generateLiveTransport();
    
    // Update transport positions every 10 seconds
    const interval = setInterval(() => {
      setLiveTransport(prev => prev.map(transport => ({
        ...transport,
        lat: transport.lat + (Math.random() - 0.5) * 0.001, // Small movement
        lng: transport.lng + (Math.random() - 0.5) * 0.001
      })));
    }, 10000);

    return () => clearInterval(interval);
  }, [userLocation]);

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
        />
      </div>
      
      {/* Location Status */}
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
      
      {/* Priority Selector removed in Phase 4 - replaced with scenario-based actions */}
      
      {/* Phase 4: Priority indicators replaced with scenario-based UI */}
      
      {/* Transport Count Stats */}
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

      {/* Contextual FAB with Attached Panels */}
      <ContextualFAB 
        onScenarioSelect={onScenarioSelect}
        onScenarioComplete={onScenarioComplete}
        activeScenario={activeScenario}
        user={user}
      />

      {/* Scenario Modals */}
      {activeScenario === 'emergency_transport' && (
        <EmergencyTransportModal
          userLocation={userLocation}
          onClose={onScenarioComplete}
        />
      )}
      
      {activeScenario === 'share_ride' && (
        <ShareRideModal
          userLocation={userLocation}
          onClose={onScenarioComplete}
        />
      )}
      
      {activeScenario === 'spot_transport' && (
        <SpotTransportModal
          userLocation={userLocation}
          onClose={onScenarioComplete}
        />
      )}
      
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
    </div>
  );
}

export default LiveCityMap;