import { useState, useEffect, useRef } from 'react';
import { useTransport } from '../contexts/TransportContext';
import './PublicTransitTracker.css';

const PublicTransitTracker = ({ user, onNavigate }) => {
  const {
    selectedTransportType,
    routes,
    selectedRoute,
    selectRoute,
    routeStops,
    startTracking,
    updateTrackingLocation,
    stopTracking,
    fetchLiveTracking,
    getPrediction,
    loading
  } = useTransport();

  const [currentStep, setCurrentStep] = useState('route-selection'); // route-selection, tracking, sharing-location
  const [currentLocation, setCurrentLocation] = useState(null);
  const [trackingSession, setTrackingSession] = useState(null);
  const [isTrackingActive, setIsTrackingActive] = useState(false);
  const [nearbyStops, setNearbyStops] = useState([]);
  const [predictions, setPredictions] = useState({});
  const [trackingStartTime, setTrackingStartTime] = useState(null);
  const watchIdRef = useRef(null);

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setCurrentLocation(location);
          findNearbyStops(location);
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  }, []);

  // Find nearby stops based on current location
  const findNearbyStops = (location) => {
    if (!routeStops.length) return;

    const nearby = routeStops
      .map(stop => ({
        ...stop,
        distance: calculateDistance(location, { lat: stop.latitude, lng: stop.longitude })
      }))
      .filter(stop => stop.distance < 1) // Within 1km
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5);

    setNearbyStops(nearby);
  };

  // Calculate distance between two points
  const calculateDistance = (point1, point2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLon = (point2.lng - point1.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Start tracking the user's location on this route
  const handleStartTracking = async (route) => {
    if (!currentLocation) {
      alert('Please enable location access to start tracking');
      return;
    }

    try {
      setIsTrackingActive(true);
      setTrackingStartTime(new Date());
      
      // Start tracking session
      const tracking = await startTracking(user.id, route.id, currentLocation);
      setTrackingSession(tracking);
      setCurrentStep('sharing-location');

      // Start continuous location updates
      if (navigator.geolocation) {
        watchIdRef.current = navigator.geolocation.watchPosition(
          async (position) => {
            const newLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            setCurrentLocation(newLocation);
            
            // Update tracking location
            if (tracking?.id) {
              await updateTrackingLocation(tracking.id, newLocation);
            }

            // Update nearby stops
            findNearbyStops(newLocation);
            
            // Get predictions for nearby stops
            updatePredictions(newLocation);
          },
          (error) => console.error('Error tracking location:', error),
          { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
        );
      }
    } catch (error) {
      console.error('Error starting tracking:', error);
      setIsTrackingActive(false);
    }
  };

  // Stop tracking
  const handleStopTracking = async () => {
    try {
      if (trackingSession?.id) {
        await stopTracking(trackingSession.id);
      }
      
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }

      setIsTrackingActive(false);
      setTrackingSession(null);
      setCurrentStep('route-selection');
      setTrackingStartTime(null);
    } catch (error) {
      console.error('Error stopping tracking:', error);
    }
  };

  // Update predictions for nearby stops
  const updatePredictions = async (location) => {
    if (!selectedRoute || !nearbyStops.length) return;

    const newPredictions = {};
    for (const stop of nearbyStops) {
      try {
        const prediction = await getPrediction(selectedRoute.id, stop.id, location);
        newPredictions[stop.id] = prediction;
      } catch (error) {
        console.error(`Error getting prediction for stop ${stop.id}:`, error);
      }
    }
    setPredictions(newPredictions);
  };

  // Format tracking duration
  const formatTrackingDuration = () => {
    if (!trackingStartTime) return '0:00';
    const duration = Math.floor((new Date() - trackingStartTime) / 1000);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!selectedTransportType || selectedTransportType.name === 'Ride Sharing') {
    return (
      <div className="public-transit-tracker">
        <div className="not-applicable">
          <h3>🚌 Public Transit Tracking</h3>
          <p>Please select a public transport mode (Bus, Train, Metro, or Auto-rickshaw) to start tracking.</p>
        </div>
      </div>
    );
  }

  if (currentStep === 'route-selection') {
    return (
      <div className="public-transit-tracker">
        <div className="tracker-header">
          <h3>
            {selectedTransportType.icon} Track {selectedTransportType.name}
          </h3>
          <p>Help the community by sharing your location while traveling</p>
        </div>

        {routes.length === 0 ? (
          <div className="no-routes">
            <div className="empty-state">
              <span className="empty-icon">🗺️</span>
              <h4>No Routes Available</h4>
              <p>We don't have {selectedTransportType.name.toLowerCase()} routes mapped yet for your area.</p>
              <button className="contribute-btn" onClick={() => onNavigate('profile')}>
                Help Us Map Routes
              </button>
            </div>
          </div>
        ) : (
          <div className="route-selection">
            <h4>🛤️ Select Your Route</h4>
            <div className="routes-grid">
              {routes.map((route) => (
                <div
                  key={route.id}
                  className={`route-card ${selectedRoute?.id === route.id ? 'selected' : ''}`}
                  onClick={() => selectRoute(route)}
                >
                  <div className="route-header">
                    <span className="route-number">{route.route_number}</span>
                    <span className="route-type">{selectedTransportType.icon}</span>
                  </div>
                  <div className="route-info">
                    <h5>{route.route_name}</h5>
                    <p>{route.start_point} → {route.end_point}</p>
                  </div>
                  {selectedRoute?.id === route.id && (
                    <button
                      className="start-tracking-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartTracking(route);
                      }}
                      disabled={!currentLocation}
                    >
                      {currentLocation ? 'Start Tracking' : 'Getting Location...'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {currentLocation && nearbyStops.length > 0 && (
          <div className="nearby-stops">
            <h4>📍 Nearby Stops</h4>
            <div className="stops-list">
              {nearbyStops.map((stop) => (
                <div key={stop.id} className="stop-item">
                  <div className="stop-info">
                    <span className="stop-name">{stop.stop_name}</span>
                    <span className="stop-distance">{(stop.distance * 1000).toFixed(0)}m away</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (currentStep === 'sharing-location') {
    return (
      <div className="public-transit-tracker tracking-active">
        <div className="tracking-header">
          <div className="tracking-status">
            <span className="tracking-indicator">🔴 LIVE</span>
            <span className="tracking-duration">{formatTrackingDuration()}</span>
          </div>
          <h3>
            {selectedTransportType.icon} Tracking {selectedRoute?.route_name}
          </h3>
          <p>Your location is being shared to help predict arrival times</p>
        </div>

        <div className="tracking-info">
          <div className="current-route">
            <div className="route-details">
              <span className="route-number">{selectedRoute?.route_number}</span>
              <div className="route-path">
                <span>{selectedRoute?.start_point}</span>
                <span className="arrow">→</span>
                <span>{selectedRoute?.end_point}</span>
              </div>
            </div>
          </div>

          {nearbyStops.length > 0 && (
            <div className="live-predictions">
              <h4>🚏 Upcoming Stops</h4>
              <div className="predictions-list">
                {nearbyStops.map((stop) => (
                  <div key={stop.id} className="prediction-item">
                    <div className="stop-info">
                      <span className="stop-name">{stop.stop_name}</span>
                      <span className="stop-distance">{(stop.distance * 1000).toFixed(0)}m</span>
                    </div>
                    <div className="prediction-time">
                      {predictions[stop.id] ? (
                        <span className="eta">{predictions[stop.id].estimated_minutes}min</span>
                      ) : (
                        <span className="calculating">...</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="tracking-stats">
            <div className="stat">
              <span className="stat-label">Community Impact</span>
              <span className="stat-value">+5 points</span>
            </div>
            <div className="stat">
              <span className="stat-label">Distance Tracked</span>
              <span className="stat-value">2.3 km</span>
            </div>
          </div>
        </div>

        <div className="tracking-controls">
          <button className="stop-tracking-btn" onClick={handleStopTracking}>
            Stop Tracking
          </button>
          <button className="minimize-btn" onClick={() => onNavigate('home')}>
            Minimize (Keep Tracking)
          </button>
        </div>

        <div className="tracking-tips">
          <h5>💡 Tips for Better Tracking</h5>
          <ul>
            <li>Keep the app open while traveling</li>
            <li>Ensure stable internet connection</li>
            <li>Verify arrival times at stops for community points</li>
          </ul>
        </div>
      </div>
    );
  }

  return null;
};

export default PublicTransitTracker;