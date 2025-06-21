import { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { useTransport } from '../contexts/TransportContext';
import LocationSearch from './LocationSearch';
import './PublicTransitMap.css';

// Custom bus marker icons
const createBusMarker = (routeNumber, count = 1) => {
  const isCluster = count > 1;
  const size = isCluster ? 35 : 28;
  const fontSize = isCluster ? '10px' : '8px';
  
  return L.divIcon({
    className: 'bus-marker',
    html: `
      <div class="bus-marker-container ${isCluster ? 'cluster' : 'single'}">
        <div class="bus-icon">${isCluster ? count : '🚌'}</div>
        <div class="route-number">${routeNumber}</div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size/2, size],
    popupAnchor: [0, -size]
  });
};

// Map event handler component
const MapEventHandler = ({ onMapMove, onZoomChange }) => {
  const map = useMap();
  
  useMapEvents({
    moveend: () => {
      const bounds = map.getBounds();
      const zoom = map.getZoom();
      onMapMove(bounds, zoom);
    },
    zoomend: () => {
      const bounds = map.getBounds();
      const zoom = map.getZoom();
      onZoomChange(bounds, zoom);
    }
  });

  return null;
};

const PublicTransitMap = ({ user, onNavigate }) => {
  const {
    selectedTransportType,
    routes,
    fetchLiveTracking,
    startTracking
  } = useTransport();

  // Map state
  const [mapCenter, setMapCenter] = useState([17.3850, 78.4867]); // Hyderabad default
  const [mapZoom, setMapZoom] = useState(12);
  const [mapBounds, setMapBounds] = useState(null);
  
  // Search state
  const [searchType, setSearchType] = useState('bus-number'); // bus-number, route, destination
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  // Bus tracking state
  const [liveBuses, setLiveBuses] = useState([]);
  const [busMarkers, setBusMarkers] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [searchRadius, setSearchRadius] = useState(2); // km
  
  // Polling
  const [isPolling, setIsPolling] = useState(true);
  const pollingIntervalRef = useRef(null);

  // Get user's current location
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
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  }, []);

  // Start/stop polling based on map visibility and transport type
  useEffect(() => {
    if (selectedTransportType && selectedTransportType.name !== 'Ride Sharing' && mapBounds) {
      startPolling();
    } else {
      stopPolling();
    }

    return () => stopPolling();
  }, [selectedTransportType, mapBounds]);

  const startPolling = () => {
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    
    // Initial fetch
    fetchLiveBusesInViewport();
    
    // Set up polling every 10 seconds
    pollingIntervalRef.current = setInterval(() => {
      if (isPolling) {
        fetchLiveBusesInViewport();
      }
    }, 10000);
  };

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  // Fetch live buses in current map viewport
  const fetchLiveBusesInViewport = async () => {
    if (!mapBounds || !selectedTransportType) return;

    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_BASE}/api/tracking/live/viewport`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transport_type_id: selectedTransportType.id,
          bounds: {
            north: mapBounds.getNorth(),
            south: mapBounds.getSouth(),
            east: mapBounds.getEast(),
            west: mapBounds.getWest()
          },
          zoom_level: mapZoom
        })
      });

      if (response.ok) {
        const data = await response.json();
        setLiveBuses(data.buses || []);
        createBusMarkers(data.buses || []);
      }
    } catch (error) {
      console.error('Error fetching live buses:', error);
    }
  };

  // Create bus markers with clustering logic
  const createBusMarkers = (buses) => {
    const markers = [];
    const clusterDistance = mapZoom > 14 ? 50 : mapZoom > 12 ? 100 : 200; // pixels
    
    // Group buses by proximity for clustering
    const clusters = [];
    
    buses.forEach((bus) => {
      const existingCluster = clusters.find(cluster => {
        const distance = calculatePixelDistance(
          bus.current_lat, bus.current_lng,
          cluster.center_lat, cluster.center_lng,
          mapZoom
        );
        return distance < clusterDistance;
      });

      if (existingCluster) {
        existingCluster.buses.push(bus);
        // Update cluster center (average position)
        const totalBuses = existingCluster.buses.length;
        existingCluster.center_lat = existingCluster.buses.reduce((sum, b) => sum + b.current_lat, 0) / totalBuses;
        existingCluster.center_lng = existingCluster.buses.reduce((sum, b) => sum + b.current_lng, 0) / totalBuses;
      } else {
        clusters.push({
          buses: [bus],
          center_lat: bus.current_lat,
          center_lng: bus.current_lng
        });
      }
    });

    // Create markers for clusters
    clusters.forEach((cluster, index) => {
      const busCount = cluster.buses.length;
      const routeNumbers = [...new Set(cluster.buses.map(b => b.route_number))];
      const displayRoute = routeNumbers.length === 1 ? routeNumbers[0] : `${routeNumbers.length} routes`;

      if (busCount === 1 && mapZoom > 13) {
        // Show individual buses when zoomed in
        cluster.buses.forEach((bus) => {
          markers.push({
            id: `bus-${bus.id}`,
            position: [bus.current_lat, bus.current_lng],
            icon: createBusMarker(bus.route_number, 1),
            popup: (
              <div className="bus-popup">
                <h4>Bus {bus.route_number}</h4>
                <p><strong>Route:</strong> {bus.route_name}</p>
                <p><strong>Speed:</strong> {bus.speed || 0} km/h</p>
                <p><strong>Last Update:</strong> {new Date(bus.last_update).toLocaleTimeString()}</p>
                <button onClick={() => handleTrackBus(bus)}>
                  Track This Bus
                </button>
              </div>
            )
          });
        });
      } else {
        // Show cluster
        markers.push({
          id: `cluster-${index}`,
          position: [cluster.center_lat, cluster.center_lng],
          icon: createBusMarker(displayRoute, busCount),
          popup: (
            <div className="cluster-popup">
              <h4>{busCount} Buses in Area</h4>
              <div className="cluster-routes">
                {routeNumbers.map(route => (
                  <span key={route} className="route-badge">{route}</span>
                ))}
              </div>
              <button onClick={() => handleZoomToCluster(cluster)}>
                Zoom In to See Individual Buses
              </button>
            </div>
          )
        });
      }
    });

    setBusMarkers(markers);
  };

  // Calculate pixel distance between two coordinates
  const calculatePixelDistance = (lat1, lng1, lat2, lng2, zoom) => {
    const earthRadius = 6371000; // meters
    const latRad1 = lat1 * Math.PI / 180;
    const latRad2 = lat2 * Math.PI / 180;
    const deltaLat = (lat2 - lat1) * Math.PI / 180;
    const deltaLng = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
              Math.cos(latRad1) * Math.cos(latRad2) *
              Math.sin(deltaLng/2) * Math.sin(deltaLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = earthRadius * c;

    // Convert to pixels (approximate)
    const metersPerPixel = 156543.03392 * Math.cos(latRad1) / Math.pow(2, zoom);
    return distance / metersPerPixel;
  };

  // Handle map movement
  const handleMapMove = useCallback((bounds, zoom) => {
    setMapBounds(bounds);
    setMapZoom(zoom);
  }, []);

  // Handle zoom change
  const handleZoomChange = useCallback((bounds, zoom) => {
    setMapBounds(bounds);
    setMapZoom(zoom);
    // Re-cluster markers based on new zoom level
    createBusMarkers(liveBuses);
  }, [liveBuses]);

  // Search functionality
  const handleSearch = async (query, type = searchType) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      let searchEndpoint = '';
      
      switch (type) {
        case 'bus-number':
          searchEndpoint = `/api/search/bus-number?query=${encodeURIComponent(query)}`;
          break;
        case 'route':
          searchEndpoint = `/api/search/route?query=${encodeURIComponent(query)}`;
          break;
        case 'destination':
          searchEndpoint = `/api/search/destination?query=${encodeURIComponent(query)}`;
          break;
      }

      // Add user location and radius for vicinity search
      if (userLocation) {
        searchEndpoint += `&lat=${userLocation.lat}&lng=${userLocation.lng}&radius=${searchRadius}`;
      }

      const response = await fetch(`${API_BASE}${searchEndpoint}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.results || []);
        setShowSearchResults(true);
        
        // If no results in current radius, suggest expanding
        if (data.results.length === 0 && searchRadius < 10) {
          setTimeout(() => {
            setSearchRadius(prev => Math.min(prev + 2, 10));
            handleSearch(query, type); // Retry with larger radius
          }, 1000);
        }
      }
    } catch (error) {
      console.error('Error searching:', error);
    }
  };

  // Handle search result selection
  const handleSearchResultSelect = (result) => {
    setShowSearchResults(false);
    setSearchQuery(result.display_name);
    
    // Focus map on result location
    if (result.buses && result.buses.length > 0) {
      const firstBus = result.buses[0];
      setMapCenter([firstBus.lat, firstBus.lng]);
      setMapZoom(15);
    } else if (result.route_bounds) {
      // Focus on route bounds
      setMapCenter([
        (result.route_bounds.north + result.route_bounds.south) / 2,
        (result.route_bounds.east + result.route_bounds.west) / 2
      ]);
      setMapZoom(13);
    }
  };

  // Handle bus tracking
  const handleTrackBus = (bus) => {
    // Start tracking this specific bus/route
    if (userLocation) {
      startTracking(user.id, bus.route_id, userLocation);
    }
  };

  // Handle cluster zoom
  const handleZoomToCluster = (cluster) => {
    setMapCenter([cluster.center_lat, cluster.center_lng]);
    setMapZoom(Math.min(mapZoom + 2, 18));
  };

  // Get appropriate placeholder text for search input
  const getSearchPlaceholder = () => {
    switch (searchType) {
      case 'bus-number':
        return 'Enter bus number (e.g., 185G, 102, 49M)...';
      case 'route':
        return 'Enter route name (e.g., Jubilee Hills - HITEC City)...';
      case 'destination':
        return 'Enter destination (e.g., HITEC City, Begumpet)...';
      default:
        return 'Search...';
    }
  };

  if (!selectedTransportType || selectedTransportType.name === 'Ride Sharing') {
    return (
      <div className="public-transit-map">
        <div className="not-applicable">
          <h3>🗺️ Public Transit Map</h3>
          <p>Please select a public transport mode to view live bus locations.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="public-transit-map">
      {/* Search Interface */}
      <div className="search-container">
        <div className="search-header">
          <h3>🗺️ Live {selectedTransportType.name} Tracker</h3>
          <div className="search-controls">
            <select 
              value={searchType} 
              onChange={(e) => setSearchType(e.target.value)}
              className="search-type-selector"
            >
              <option value="bus-number">Bus Number (e.g., 185G, 102, 49M)</option>
              <option value="route">Route Name (e.g., Jubilee Hills - HITEC City)</option>
              <option value="destination">Destination (e.g., HITEC City, Begumpet)</option>
            </select>
            <div className="search-input-container">
              <input
                type="text"
                placeholder={getSearchPlaceholder()}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  handleSearch(e.target.value);
                }}
                className="search-input"
              />
              {searchQuery && (
                <button 
                  className="clear-search"
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                    setShowSearchResults(false);
                    setSearchRadius(2);
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>
          
          {/* Search Help Text */}
          <div className="search-help">
            {searchType === 'bus-number' && (
              <p>💡 Search for buses by their painted number (e.g., 185G for Jubilee Hills to HITEC City)</p>
            )}
            {searchType === 'route' && (
              <p>💡 Search by the complete route description (e.g., "Jubilee Hills - HITEC City")</p>
            )}
            {searchType === 'destination' && (
              <p>💡 Search for buses going to specific places (e.g., "HITEC City", "Begumpet", "Charminar")</p>
            )}
          </div>
        </div>

        {/* Search Results */}
        {showSearchResults && (
          <div className="search-results">
            {searchResults.length === 0 ? (
              <div className="no-results">
                <p>No {searchType.replace('-', ' ')} found within {searchRadius}km</p>
                {searchRadius < 10 && <p>Expanding search radius...</p>}
              </div>
            ) : (
              <div className="results-list">
                {searchResults.map((result, index) => (
                  <div 
                    key={index}
                    className="search-result-item"
                    onClick={() => handleSearchResultSelect(result)}
                  >
                    <div className="result-main">
                      <span className="result-title">{result.display_name}</span>
                      <span className="result-subtitle">{result.subtitle}</span>
                    </div>
                    <div className="result-meta">
                      {result.buses_count && (
                        <span className="buses-count">{result.buses_count} buses</span>
                      )}
                      {result.distance && (
                        <span className="distance">{result.distance.toFixed(1)}km</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Map Container */}
      <div className="map-wrapper">
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          className="transit-map"
          zoomControl={true}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
          />
          
          <MapEventHandler 
            onMapMove={handleMapMove}
            onZoomChange={handleZoomChange}
          />

          {/* User Location Marker */}
          {userLocation && (
            <Marker
              position={[userLocation.lat, userLocation.lng]}
              icon={L.divIcon({
                className: 'user-location-marker',
                html: '<div class="user-dot"></div>',
                iconSize: [20, 20],
                iconAnchor: [10, 10]
              })}
            >
              <Popup>Your Location</Popup>
            </Marker>
          )}

          {/* Bus Markers */}
          {busMarkers.map((marker) => (
            <Marker
              key={marker.id}
              position={marker.position}
              icon={marker.icon}
            >
              <Popup>{marker.popup}</Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Map Status */}
        <div className="map-status">
          <div className="status-item">
            <span className={`polling-indicator ${isPolling ? 'active' : 'inactive'}`}>
              {isPolling ? '🔴' : '⚫'} Live Updates
            </span>
          </div>
          <div className="status-item">
            <span className="bus-count">{liveBuses.length} buses in view</span>
          </div>
          {searchRadius > 2 && (
            <div className="status-item">
              <span className="search-radius">Search radius: {searchRadius}km</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicTransitMap;