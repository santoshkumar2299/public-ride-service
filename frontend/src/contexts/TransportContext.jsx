import { createContext, useContext, useState, useEffect } from 'react';

const TransportContext = createContext();

export const useTransport = () => {
  const context = useContext(TransportContext);
  if (!context) {
    throw new Error('useTransport must be used within a TransportProvider');
  }
  return context;
};

export const TransportProvider = ({ children }) => {
  const [transportTypes, setTransportTypes] = useState([]);
  const [selectedTransportType, setSelectedTransportType] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [routeStops, setRouteStops] = useState([]);
  const [liveTracking, setLiveTracking] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Base API URL (Vite uses VITE_ prefix instead of REACT_APP_)
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  // Fetch all transport types on component mount
  useEffect(() => {
    fetchTransportTypes();
  }, []);

  // Fetch routes when transport type changes
  useEffect(() => {
    if (selectedTransportType) {
      fetchRoutes(selectedTransportType.id);
    } else {
      setRoutes([]);
      setSelectedRoute(null);
    }
  }, [selectedTransportType]);

  // Fetch stops when route changes
  useEffect(() => {
    if (selectedRoute) {
      fetchRouteStops(selectedRoute.id);
    } else {
      setRouteStops([]);
    }
  }, [selectedRoute]);

  const fetchTransportTypes = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/transports/types`);
      if (!response.ok) throw new Error('Failed to fetch transport types');
      
      const data = await response.json();
      setTransportTypes(data.transport_types || []);
      
      // Auto-select bus as default
      const busType = data.transport_types?.find(type => type.name.toLowerCase() === 'bus');
      if (busType && !selectedTransportType) {
        setSelectedTransportType(busType);
      }
    } catch (err) {
      setError('Failed to load transport types');
      console.error('Error fetching transport types:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoutes = async (transportTypeId) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/transports/routes?type_id=${transportTypeId}&city_id=hyderabad`);
      if (!response.ok) throw new Error('Failed to fetch routes');
      
      const data = await response.json();
      setRoutes(data.routes || []);
    } catch (err) {
      setError('Failed to load routes');
      console.error('Error fetching routes:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRouteStops = async (routeId) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/transports/routes/${routeId}/stops`);
      if (!response.ok) throw new Error('Failed to fetch stops');
      
      const data = await response.json();
      setRouteStops(data.stops || []);
    } catch (err) {
      setError('Failed to load stops');
      console.error('Error fetching stops:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLiveTracking = async (routeId) => {
    try {
      const response = await fetch(`${API_BASE}/api/tracking/live/${routeId}`);
      if (!response.ok) throw new Error('Failed to fetch live tracking');
      
      const data = await response.json();
      setLiveTracking(data.live_tracking || []);
      return data.live_tracking;
    } catch (err) {
      console.error('Error fetching live tracking:', err);
      return [];
    }
  };

  const startTracking = async (userId, routeId, location) => {
    try {
      const response = await fetch(`${API_BASE}/api/tracking/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          route_id: routeId,
          location: location
        }),
      });

      if (!response.ok) throw new Error('Failed to start tracking');
      
      const data = await response.json();
      return data.tracking;
    } catch (err) {
      setError('Failed to start tracking');
      console.error('Error starting tracking:', err);
      throw err;
    }
  };

  const updateTrackingLocation = async (trackingId, location) => {
    try {
      const response = await fetch(`${API_BASE}/api/tracking/${trackingId}/location`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ location }),
      });

      if (!response.ok) throw new Error('Failed to update location');
      
      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Error updating location:', err);
      throw err;
    }
  };

  const stopTracking = async (trackingId) => {
    try {
      const response = await fetch(`${API_BASE}/api/tracking/${trackingId}/stop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) throw new Error('Failed to stop tracking');
      
      const data = await response.json();
      return data;
    } catch (err) {
      setError('Failed to stop tracking');
      console.error('Error stopping tracking:', err);
      throw err;
    }
  };

  const getPrediction = async (routeId, stopId, currentLocation) => {
    try {
      const locationParam = encodeURIComponent(JSON.stringify(currentLocation));
      const response = await fetch(`${API_BASE}/api/predictions/route/${routeId}/stop/${stopId}?current_location=${locationParam}`);
      
      if (!response.ok) throw new Error('Failed to get prediction');
      
      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Error getting prediction:', err);
      throw err;
    }
  };

  const selectTransportType = (transportType) => {
    setSelectedTransportType(transportType);
    setSelectedRoute(null); // Reset route selection
    setError(null);
  };

  const selectRoute = (route) => {
    setSelectedRoute(route);
    setError(null);
  };

  const resetTransportSelection = () => {
    setSelectedTransportType(null);
    setSelectedRoute(null);
    setRoutes([]);
    setRouteStops([]);
    setLiveTracking([]);
    setError(null);
  };

  const getTransportIcon = (transportName) => {
    const icons = {
      'Bus': '🚌',
      'Train': '🚆',
      'Metro': '🚇',
      'Auto-rickshaw': '🛺'
    };
    return icons[transportName] || '🚌';
  };

  const value = {
    // State
    transportTypes,
    selectedTransportType,
    routes,
    selectedRoute,
    routeStops,
    liveTracking,
    loading,
    error,

    // Actions
    selectTransportType,
    selectRoute,
    resetTransportSelection,
    fetchLiveTracking,
    startTracking,
    updateTrackingLocation,
    stopTracking,
    getPrediction,
    getTransportIcon,

    // Utility
    isRideSharing: selectedTransportType?.name === 'Ride Sharing' || !selectedTransportType,
    isPublicTransport: selectedTransportType && selectedTransportType.name !== 'Ride Sharing'
  };

  return (
    <TransportContext.Provider value={value}>
      {children}
    </TransportContext.Provider>
  );
};

export default TransportContext;