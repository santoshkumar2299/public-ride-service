import { useState, useEffect } from 'react';
import MapView from './MapView';
import { config } from '../config/env';

function RouteMap({ pickup, destination }) {
  const [routeInfo, setRouteInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Calculate route info when locations change
  useEffect(() => {
    if (pickup && destination && pickup.lat && pickup.lng && destination.lat && destination.lng) {
      calculateRoute();
    } else {
      setRouteInfo(null);
    }
  }, [pickup, destination]);

  const calculateRoute = async () => {
    setIsLoading(true);
    try {
      // Calculate straight-line distance (for now)
      const distance = calculateDistance(
        pickup.lat, pickup.lng, 
        destination.lat, destination.lng
      );
      
      // Estimate travel time (rough estimate: 30km/h average in city)
      const estimatedTime = Math.round((distance / 30) * 60); // minutes
      
      setRouteInfo({
        distance: distance.toFixed(1),
        estimatedTime: estimatedTime,
        polyline: [{
          start: { lat: pickup.lat, lng: pickup.lng },
          end: { lat: destination.lat, lng: destination.lng }
        }]
      });
    } catch (error) {
      console.error('Route calculation error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const getMapCenter = () => {
    if (!pickup || !destination) return [config.defaultMapCenter.lat, config.defaultMapCenter.lng];
    
    const centerLat = (pickup.lat + destination.lat) / 2;
    const centerLng = (pickup.lng + destination.lng) / 2;
    return [centerLat, centerLng];
  };

  const getMapBounds = () => {
    if (!pickup || !destination) return null;
    
    const latDiff = Math.abs(pickup.lat - destination.lat);
    const lngDiff = Math.abs(pickup.lng - destination.lng);
    
    // Add padding to ensure both points are visible
    const padding = 0.15;
    const latPadding = Math.max(latDiff * padding, 0.01);
    const lngPadding = Math.max(lngDiff * padding, 0.01);
    
    return {
      north: Math.max(pickup.lat, destination.lat) + latPadding,
      south: Math.min(pickup.lat, destination.lat) - latPadding,
      east: Math.max(pickup.lng, destination.lng) + lngPadding,
      west: Math.min(pickup.lng, destination.lng) - lngPadding
    };
  };

  const getMapMarkers = () => {
    const markers = [];
    
    if (pickup && pickup.lat && pickup.lng) {
      markers.push({
        latitude: pickup.lat,
        longitude: pickup.lng,
        title: "Pickup Location",
        icon: '🚶',
        color: '#007bff'
      });
    }
    
    if (destination && destination.lat && destination.lng) {
      markers.push({
        latitude: destination.lat,
        longitude: destination.lng,
        title: "Destination",
        icon: '🎯',
        color: '#28a745'
      });
    }
    
    return markers;
  };

  const getRoutes = () => {
    if (!routeInfo || !routeInfo.polyline) return [];
    
    return routeInfo.polyline.map(route => ({
      start: route.start,
      end: route.end,
      color: "#007bff",
      weight: 4,
      title: "Your Route"
    }));
  };

  if (!pickup || !destination || !pickup.lat || !destination.lat) {
    return null;
  }

  return (
    <div className="route-map">
      <div className="route-header">
        <h4>🗺️ Your Route</h4>
        {routeInfo && (
          <div className="route-info">
            <span className="route-distance">📏 {routeInfo.distance} km</span>
            <span className="route-time">⏱️ ~{routeInfo.estimatedTime} min</span>
          </div>
        )}
      </div>
      
      <div className="route-map-container">
        {isLoading ? (
          <div className="route-loading">
            <span className="loading-spinner">🔄</span>
            <span>Calculating route...</span>
          </div>
        ) : (
          <MapView
            center={getMapCenter()}
            zoom={12}
            markers={getMapMarkers()}
            routes={getRoutes()}
            bounds={getMapBounds()}
            height="200px"
          />
        )}
      </div>
      
      <div className="route-summary">
        <div className="route-point">
          <span className="route-icon">🚶</span>
          <span className="route-label">Pickup:</span>
          <span className="route-address">{pickup.address}</span>
        </div>
        <div className="route-arrow">↓</div>
        <div className="route-point">
          <span className="route-icon">🎯</span>
          <span className="route-label">Destination:</span>
          <span className="route-address">{destination.address}</span>
        </div>
      </div>
    </div>
  );
}

export default RouteMap;