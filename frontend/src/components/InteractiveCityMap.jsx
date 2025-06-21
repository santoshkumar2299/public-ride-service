import { useState, useEffect } from 'react';
import MapView from './MapView';
import PrioritySelector from './PrioritySelector';
import { config } from '../config/env';

function InteractiveCityMap({ user, onPrioritySelect, onTransportSelect }) {
  const [userLocation, setUserLocation] = useState(null);
  const [showPrioritySelector, setShowPrioritySelector] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState(null);
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
          
          // Show priority selector after location is detected
          setTimeout(() => setShowPrioritySelector(true), 1000);
        },
        (error) => {
          console.log('Location detection failed:', error);
          // Fallback to default location and show priority selector
          setTimeout(() => setShowPrioritySelector(true), 500);
        },
        { timeout: 5000, enableHighAccuracy: false }
      );
    } else {
      // No geolocation support, show priority selector
      setTimeout(() => setShowPrioritySelector(true), 500);
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

  const handlePrioritySelect = (priority) => {
    setSelectedPriority(priority);
    setShowPrioritySelector(false);
    
    // Filter and highlight relevant transport based on priority
    const filteredTransport = filterTransportByPriority(priority);
    setLiveTransport(filteredTransport);
    
    if (onPrioritySelect) {
      onPrioritySelect(priority);
    }
  };

  const filterTransportByPriority = (priority) => {
    return liveTransport.map(transport => {
      let relevance = 0;
      
      switch (priority) {
        case 'speed':
          relevance = transport.type === 'ride' ? 3 : transport.type === 'auto' ? 2 : 1;
          break;
        case 'budget':
          relevance = transport.type === 'bus' ? 3 : transport.type === 'auto' ? 2 : 1;
          break;
        case 'eco':
          relevance = transport.type === 'bus' ? 3 : transport.type === 'ride' ? 1 : 2;
          break;
        case 'direct':
          relevance = transport.type === 'ride' ? 3 : transport.type === 'auto' ? 3 : 1;
          break;
        default:
          relevance = 2;
      }
      
      return {
        ...transport,
        relevance,
        highlighted: relevance >= 2
      };
    });
  };

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

  return (
    <div className="interactive-city-map">
      {/* Full Screen Map */}
      <div className="city-map-container">
        <MapView
          center={mapCenter}
          zoom={mapZoom}
          markers={getMapMarkers()}
          height="100vh"
          showControls={true}
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
      
      {/* Priority Selector Overlay */}
      {showPrioritySelector && (
        <PrioritySelector 
          onPrioritySelect={handlePrioritySelect}
          onClose={() => setShowPrioritySelector(false)}
        />
      )}
      
      {/* Selected Priority Indicator */}
      {selectedPriority && (
        <div className="selected-priority-indicator">
          <div className="priority-badge">
            <span className="priority-icon">
              {selectedPriority === 'speed' ? '⚡' : 
               selectedPriority === 'budget' ? '💰' :
               selectedPriority === 'eco' ? '🌱' : '🎯'}
            </span>
            <span className="priority-text">
              {selectedPriority === 'speed' ? 'Speed Priority' : 
               selectedPriority === 'budget' ? 'Budget Priority' :
               selectedPriority === 'eco' ? 'Eco Priority' : 'Direct Priority'}
            </span>
            <button 
              className="change-priority-btn"
              onClick={() => setShowPrioritySelector(true)}
              title="Change Priority"
            >
              ↻
            </button>
          </div>
        </div>
      )}
      
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
    </div>
  );
}

export default InteractiveCityMap;