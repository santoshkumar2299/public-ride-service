import { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { config } from '../config/env';
import { getRoute } from '../services/routingService';
import CustomZoomControls from './CustomZoomControls';

// Fix for default markers in Leaflet with React
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import markerRetina from 'leaflet/dist/images/marker-icon-2x.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerRetina,
  shadowUrl: markerShadow,
});

// Custom marker icons
const createCustomIcon = (color, icon) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background: ${color || '#ff0000'};
      width: 30px;
      height: 30px;
      border-radius: 50%;
      border: 3px solid white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.3);
    ">${icon || '📍'}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
};

// Component to handle map clicks
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click: (e) => {
      if (onMapClick) {
        onMapClick({ 
          lngLat: { lat: e.latlng.lat, lng: e.latlng.lng },
          originalEvent: e.originalEvent
        });
      }
    },
  });
  return null;
}

// Component to handle map bounds
function MapBoundsHandler({ bounds }) {
  const map = useMap();
  
  useEffect(() => {
    if (bounds && bounds.north && bounds.south && bounds.east && bounds.west) {
      const leafletBounds = L.latLngBounds(
        [bounds.south, bounds.west], // southwest
        [bounds.north, bounds.east]  // northeast
      );
      
      // Fit the map to the bounds with padding
      map.fitBounds(leafletBounds, {
        padding: [20, 20], // 20px padding on all sides
        maxZoom: 18,       // Allow closer zoom for 200m view
        animate: true,     // Smooth animation
        duration: 0.5      // Animation duration
      });
    }
  }, [map, bounds]);
  
  return null;
}

// Component to handle max bounds restriction (prevent panning outside bounds)
function MapMaxBoundsHandler({ bounds }) {
  const map = useMap();
  
  useEffect(() => {
    if (bounds && bounds.north && bounds.south && bounds.east && bounds.west) {
      const leafletBounds = L.latLngBounds(
        [bounds.south, bounds.west], // southwest
        [bounds.north, bounds.east]  // northeast
      );
      
      console.log('Setting strict max bounds:', bounds);
      console.log('Leaflet bounds object:', leafletBounds);
      
      // Set max bounds to restrict panning
      map.setMaxBounds(leafletBounds);
      
      // Set strict zoom restrictions for the bounded area
      map.setMinZoom(16); // Prevent zooming out too far from 200m
      map.setMaxZoom(20); // Allow very detailed view
      
      // Fit to bounds initially with no padding
      map.fitBounds(leafletBounds, {
        padding: [0, 0], // No padding for strict bounds
        maxZoom: 18      // Good zoom for 200m view
      });
      
      // Add aggressive pan restriction listener
      const restrictPan = () => {
        const currentCenter = map.getCenter();
        if (!leafletBounds.contains(currentCenter)) {
          console.log('Pan out of bounds detected, forcing back to center');
          map.panTo(leafletBounds.getCenter(), { animate: false });
        }
      };
      
      map.on('moveend', restrictPan);
      map.on('drag', restrictPan);
      
      return () => {
        // Clean up max bounds and listeners when component unmounts
        console.log('Cleaning up max bounds');
        map.off('moveend', restrictPan);
        map.off('drag', restrictPan);
        map.setMaxBounds(null);
        map.setMinZoom(1);
        map.setMaxZoom(18);
      };
    }
  }, [map, bounds]);
  
  return null;
}

// Component to handle external zoom control
function MapZoomHandler({ zoom, onZoomChange }) {
  const map = useMap();
  const lastZoom = useRef(null);
  const isUserZooming = useRef(false);
  
  useEffect(() => {
    // Track when user starts zooming
    const handleZoomStart = () => {
      isUserZooming.current = true;
    };
    
    const handleZoomEnd = () => {
      // Delay reset to allow zoom detection
      setTimeout(() => {
        isUserZooming.current = false;
      }, 100);
    };
    
    map.on('zoomstart', handleZoomStart);
    map.on('zoomend', handleZoomEnd);
    
    return () => {
      map.off('zoomstart', handleZoomStart);
      map.off('zoomend', handleZoomEnd);
    };
  }, [map]);
  
  useEffect(() => {
    if (zoom !== undefined && zoom !== null && zoom !== lastZoom.current && !isUserZooming.current) {
      lastZoom.current = zoom;
      map.setZoom(zoom);
    }
  }, [map, zoom]);
  
  useEffect(() => {
    if (onZoomChange) {
      map.on('zoomend', () => {
        onZoomChange(map.getZoom());
      });
      
      return () => {
        map.off('zoomend');
      };
    }
  }, [map, onZoomChange]);
  
  return null;
}

// Component to handle radius bounds restriction
function RadiusBoundsHandler({ center, radiusMeters = 100 }) {
  const map = useMap();
  
  useEffect(() => {
    if (!center || !center.length) return;
    
    const restrictPan = () => {
      const mapCenter = map.getCenter();
      const restrictionCenter = L.latLng(center[0], center[1]);
      
      // Calculate distance from restriction center
      const distance = mapCenter.distanceTo(restrictionCenter);
      
      if (distance > radiusMeters) {
        // Calculate the bearing (direction) from restriction center to current position
        const lat1 = restrictionCenter.lat * Math.PI / 180;
        const lat2 = mapCenter.lat * Math.PI / 180;
        const deltaLng = (mapCenter.lng - restrictionCenter.lng) * Math.PI / 180;
        
        const y = Math.sin(deltaLng) * Math.cos(lat2);
        const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng);
        const bearing = Math.atan2(y, x);
        
        // Calculate the maximum allowed position on the radius boundary
        // Convert radius from meters to degrees (approximate)
        const radiusInDegrees = radiusMeters / 111320; // 1 degree ≈ 111.32 km
        
        const maxLat = restrictionCenter.lat + radiusInDegrees * Math.cos(bearing);
        const maxLng = restrictionCenter.lng + radiusInDegrees * Math.sin(bearing);
        
        // Move map back to boundary
        map.panTo([maxLat, maxLng], { animate: false });
      }
    };
    
    const restrictZoom = () => {
      const currentZoom = map.getZoom();
      const minZoom = 15; // Prevent zooming out too far from 100m radius
      const maxZoom = 20; // Prevent zooming in too close
      
      if (currentZoom < minZoom) {
        map.setZoom(minZoom);
      } else if (currentZoom > maxZoom) {
        map.setZoom(maxZoom);
      }
    };
    
    map.on('move', restrictPan);
    map.on('zoomend', restrictZoom);
    
    // Set initial zoom bounds
    map.setMinZoom(15);
    map.setMaxZoom(20);
    
    return () => {
      map.off('move', restrictPan);
      map.off('zoomend', restrictZoom);
      map.setMinZoom(1); // Reset to defaults
      map.setMaxZoom(18);
    };
  }, [map, center, radiusMeters]);
  
  return null;
}

// Component to handle map center updates
function MapCenterHandler({ center, zoom, allowUserInteraction = true }) {
  const map = useMap();
  const lastCenter = useRef(null);
  const isUserInteracting = useRef(false);
  
  useEffect(() => {
    // Track when user starts interacting with map
    const handleMoveStart = () => {
      isUserInteracting.current = true;
    };
    
    const handleMoveEnd = () => {
      // Delay reset to allow move detection
      setTimeout(() => {
        isUserInteracting.current = false;
      }, 100);
    };
    
    map.on('movestart', handleMoveStart);
    map.on('moveend', handleMoveEnd);
    
    return () => {
      map.off('movestart', handleMoveStart);
      map.off('moveend', handleMoveEnd);
    };
  }, [map]);
  
  useEffect(() => {
    if (center && center.length === 2) {
      const centerKey = `${center[0]},${center[1]}`;
      const lastCenterKey = lastCenter.current ? `${lastCenter.current[0]},${lastCenter.current[1]}` : null;
      
      // Only update if center actually changed and user is not interacting
      if (centerKey !== lastCenterKey && (!allowUserInteraction || !isUserInteracting.current)) {
        console.log('Updating map center to:', center);
        lastCenter.current = center;
        
        // Only change center, preserve current zoom level
        map.setView(center, map.getZoom(), { animate: true, duration: 0.5 });
      }
    }
  }, [map, center, zoom, allowUserInteraction]);
  
  return null;
}

// Component to handle map movement events
function MapMoveHandler({ onMapMove }) {
  const map = useMap();
  
  useEffect(() => {
    if (onMapMove) {
      const handleMoveEnd = () => {
        const center = map.getCenter();
        onMapMove({ lat: center.lat, lng: center.lng });
      };
      
      map.on('moveend', handleMoveEnd);
      
      return () => {
        map.off('moveend', handleMoveEnd);
      };
    }
  }, [map, onMapMove]);
  
  return null;
}

function MapView({ 
  center = [config.defaultMapCenter.lat, config.defaultMapCenter.lng], 
  zoom = config.defaultMapZoom, 
  markers = [], 
  routes = [], // New prop for routes between points
  bounds = null, // New prop for automatic bounds fitting
  onMapClick = null,
  height = '400px',
  showControls = true,
  onZoomChange = null, // New prop for external zoom control
  onMapMove = null, // New prop for map movement detection
  transportAnchor = null, // New prop for transport search anchor point
  showTransportArea = false // New prop to show transport search circle
}) {
  const mapRef = useRef();
  const [routeLines, setRouteLines] = useState([]);
  const routesRef = useRef();

  // Fetch routes when routes prop changes
  useEffect(() => {
    // Skip if routes haven't actually changed
    if (JSON.stringify(routes) === JSON.stringify(routesRef.current)) {
      return;
    }
    
    routesRef.current = routes;
    
    const fetchRoutes = async () => {
      if (!routes || routes.length === 0) {
        setRouteLines([]);
        return;
      }

      const newRouteLines = [];
      
      for (const route of routes) {
        if (route.start && route.end) {
          try {
            const routeData = await getRoute(route.start, route.end);
            if (routeData) {
              newRouteLines.push({
                coordinates: routeData.coordinates,
                color: route.color || '#007bff',
                weight: route.weight || 4,
                opacity: route.opacity || 0.7,
                title: route.title || 'Route',
                isStraightLine: routeData.isStraightLine
              });
            }
          } catch (error) {
            console.warn('Failed to fetch route:', error);
          }
        }
      }
      
      setRouteLines(newRouteLines);
    };

    // Only fetch if routes exist and is non-empty
    if (routes && routes.length > 0) {
      fetchRoutes();
    } else {
      setRouteLines([]);
    }
  }, [routes]);

  // Check if maps are disabled
  if (!config.enableMaps) {
    return (
      <div className="map-placeholder" style={{ height, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #ddd', borderRadius: '8px' }}>
        <div style={{ textAlign: 'center', color: '#666' }}>
          <h3>🗺️ Map View</h3>
          <p>Maps are currently disabled in configuration</p>
          <p>Set VITE_ENABLE_MAPS=true in .env to enable</p>
          <div style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
            <strong>Current markers:</strong>
            {markers.length === 0 ? (
              <p>No locations to display</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {markers.map((marker, i) => (
                  <li key={i}>
                    {marker.icon} {marker.title}: {marker.latitude.toFixed(4)}, {marker.longitude.toFixed(4)}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height, borderRadius: '8px', overflow: 'hidden', border: '1px solid #ddd' }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ width: '100%', height: '100%' }}
        ref={mapRef}
        zoomControl={false} // Always disable default, use custom controls
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {onMapClick && <MapClickHandler onMapClick={onMapClick} />}
        {bounds && <MapBoundsHandler bounds={bounds} />}
        {onZoomChange && <MapZoomHandler zoom={zoom} onZoomChange={onZoomChange} />}
        {onMapMove && <MapMoveHandler onMapMove={onMapMove} />}
        <MapCenterHandler center={center} allowUserInteraction={true} />
        
        {/* Custom zoom controls - always visible */}
        {showControls && <CustomZoomControls />}
        
        {/* Transport search area circle */}
        {showTransportArea && transportAnchor && (
          <Circle
            center={[transportAnchor.lat, transportAnchor.lng]}
            radius={100}
            pathOptions={{
              color: '#2196F3',
              fillColor: '#2196F3',
              fillOpacity: 0.1,
              weight: 2,
              dashArray: '5, 10'
            }}
          />
        )}
        
        {/* Render route polylines */}
        {routeLines.map((route, index) => (
          <Polyline
            key={index}
            positions={route.coordinates}
            color={route.color}
            weight={route.weight}
            opacity={route.opacity}
            dashArray={route.isStraightLine ? "10, 10" : undefined} // Dashed line for straight line fallback
          />
        ))}

        {/* Render markers */}
        {markers.map((marker, index) => (
          <Marker
            key={index}
            position={[marker.latitude, marker.longitude]}
            icon={createCustomIcon(marker.color, marker.icon)}
          >
            <Popup>
              <div style={{ padding: '8px' }}>
                <h4 style={{ margin: '0 0 8px 0' }}>{marker.title}</h4>
                {marker.description && <p style={{ margin: 0, fontSize: '14px' }}>{marker.description}</p>}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

export default MapView;