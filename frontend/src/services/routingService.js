import { config } from '../config/env';

// OpenRouteService API for free routing
const ORS_API_KEY = config.orsApiKey || ''; // Optional: add to env for higher rate limits
const ORS_BASE_URL = 'https://api.openrouteservice.org/v2/directions/driving-car';

// Fallback: Use simple straight line if API fails or no key
const createStraightLineRoute = (start, end) => {
  return [
    [start.lat, start.lng],
    [end.lat, end.lng]
  ];
};

// Calculate simple route between two points
export const getRoute = async (startCoords, endCoords) => {
  // Validate coordinates
  if (!startCoords?.lat || !startCoords?.lng || !endCoords?.lat || !endCoords?.lng) {
    return null;
  }

  try {
    // If no API key, return straight line
    if (!ORS_API_KEY) {
      return {
        coordinates: createStraightLineRoute(startCoords, endCoords),
        distance: calculateDistance(startCoords, endCoords),
        duration: null,
        isStraightLine: true
      };
    }

    // Use OpenRouteService API
    const url = `${ORS_BASE_URL}?api_key=${ORS_API_KEY}&start=${startCoords.lng},${startCoords.lat}&end=${endCoords.lng},${endCoords.lat}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Routing API error');
    }
    
    const data = await response.json();
    
    if (data.features && data.features[0] && data.features[0].geometry) {
      const coordinates = data.features[0].geometry.coordinates.map(coord => [coord[1], coord[0]]); // Convert [lng, lat] to [lat, lng]
      const properties = data.features[0].properties;
      
      return {
        coordinates,
        distance: properties.segments?.[0]?.distance || calculateDistance(startCoords, endCoords),
        duration: properties.segments?.[0]?.duration || null,
        isStraightLine: false
      };
    }
    
    throw new Error('Invalid routing response');
    
  } catch (error) {
    console.warn('Routing API failed, using straight line:', error.message);
    
    // Fallback to straight line
    return {
      coordinates: createStraightLineRoute(startCoords, endCoords),
      distance: calculateDistance(startCoords, endCoords),
      duration: null,
      isStraightLine: true
    };
  }
};

// Calculate distance between two coordinates (Haversine formula)
export const calculateDistance = (coord1, coord2) => {
  const R = 6371000; // Earth's radius in meters
  const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
  const dLng = (coord2.lng - coord1.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in meters
};

// Format distance for display
export const formatDistance = (meters) => {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
};

// Format duration for display
export const formatDuration = (seconds) => {
  if (!seconds) return null;
  
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  } else if (seconds < 3600) {
    return `${Math.round(seconds / 60)}min`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.round((seconds % 3600) / 60);
    return `${hours}h ${minutes}min`;
  }
};