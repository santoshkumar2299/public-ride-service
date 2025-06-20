import { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { config } from '../config/env';
import { getRoute } from '../services/routingService';

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
        onMapClick({ lngLat: { lat: e.latlng.lat, lng: e.latlng.lng } });
      }
    },
  });
  return null;
}

function MapView({ 
  center = [config.defaultMapCenter.lat, config.defaultMapCenter.lng], 
  zoom = config.defaultMapZoom, 
  markers = [], 
  routes = [], // New prop for routes between points
  onMapClick = null,
  height = '400px',
  showControls = true 
}) {
  const mapRef = useRef();
  const [routeLines, setRouteLines] = useState([]);

  // Fetch routes when routes prop changes
  useEffect(() => {
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

    fetchRoutes();
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
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {onMapClick && <MapClickHandler onMapClick={onMapClick} />}
        
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