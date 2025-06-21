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
          
          // Location detected - ready for scenario-based interactions
        },
        (error) => {
          console.log('Location detection failed:', error);
          // Fallback to default location
        },
        { timeout: 5000, enableHighAccuracy: false }
      );
    } else {
      // No geolocation support - use default location
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
        />
      </div>
      
      {/* Location Status */}
      <div className="location-status">
        <div className="status-card">
          <span className="status-icon">📍</span>
          <span className="status-text">
            {userLocation ? "Location detected" : "Using default location"}
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
    </div>
  );
}

export default LiveCityMap;