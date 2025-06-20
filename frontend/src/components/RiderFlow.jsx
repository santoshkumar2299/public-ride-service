import { useState, useEffect } from 'react'
import MapFirstView from './MapFirstView'
import MapView from './MapView'
import { config } from '../config/env'

function RiderFlow({ user, journeyData }) {
  const [formData, setFormData] = useState({
    destination: journeyData?.destination?.address || '',
    destination_lat: journeyData?.destination?.coordinates?.[1] || '',
    destination_lng: journeyData?.destination?.coordinates?.[0] || '',
    current_lat: journeyData?.pickup?.coordinates?.[1] || '',
    current_lng: journeyData?.pickup?.coordinates?.[0] || ''
  })
  const [rideId, setRideId] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [matches, setMatches] = useState([])
  const [rideStatus, setRideStatus] = useState(null)
  const [pollingInterval, setPollingInterval] = useState(null)
  const [currentLocationAddress, setCurrentLocationAddress] = useState(journeyData?.pickup?.address || '')
  const [destinationAddress, setDestinationAddress] = useState(journeyData?.destination?.address || '')
  const [modalState, setModalState] = useState({ isOpen: false, mode: 'search', type: 'current' })

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleCoordinateUpdate = (latName, latValue, lngName, lngValue) => {
    setFormData(prev => ({
      ...prev,
      [latName]: latValue,
      [lngName]: lngValue
    }))
  }

  const handleLocationSelect = (locationData) => {
    if (locationData.action) {
      // Handle action buttons (search, map)
      setModalState({
        isOpen: true,
        mode: locationData.action,
        type: locationData.type
      });
      return;
    }

    // Handle actual location selection
    const { lat, lng, address, type } = locationData;
    
    if (modalState.type === 'current') {
      setFormData(prev => ({
        ...prev,
        current_lat: lat.toString(),
        current_lng: lng.toString()
      }));
      setCurrentLocationAddress(address);
    } else {
      setFormData(prev => ({
        ...prev,
        destination_lat: lat.toString(),
        destination_lng: lng.toString()
      }));
      setDestinationAddress(address);
    }

    setModalState({ isOpen: false, mode: 'search', type: 'current' });
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({
            ...formData,
            current_lat: position.coords.latitude.toString(),
            current_lng: position.coords.longitude.toString()
          })
          setCurrentLocationAddress('Current location');
        },
        (error) => {
          alert('Unable to get your location. Please enter manually.')
        }
      )
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch(`${config.apiBaseUrl}/api/rides`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          rider_name: user.username,
          user_id: user.id,
          destination_lat: parseFloat(formData.destination_lat),
          destination_lng: parseFloat(formData.destination_lng),
          current_lat: parseFloat(formData.current_lat),
          current_lng: parseFloat(formData.current_lng)
        })
      })

      const data = await response.json()
      if (response.ok) {
        setRideId(data.id)
        startPolling(data.id)
      } else {
        alert('Error creating ride: ' + data.error)
      }
    } catch (error) {
      alert('Error: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const startPolling = (rideId) => {
    const interval = setInterval(() => {
      checkForMatches(rideId)
    }, config.pollingInterval)
    setPollingInterval(interval)
  }

  const checkForMatches = async (rideId) => {
    try {
      const [statusResponse, matchesResponse] = await Promise.all([
        fetch(`${config.apiBaseUrl}/api/rides/${rideId}/status`),
        fetch(`${config.apiBaseUrl}/api/rides/${rideId}/matches`)
      ])

      if (statusResponse.ok) {
        const statusData = await statusResponse.json()
        setRideStatus(statusData)
      }

      if (matchesResponse.ok) {
        const matchesData = await matchesResponse.json()
        setMatches(matchesData.matches)
      }
    } catch (error) {
      console.error('Error checking matches:', error)
    }
  }

  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval)
      }
    }
  }, [pollingInterval])

  if (rideId) {
    return (
      <div className="ride-dashboard">
        <h2>🚗 Your Ride is Active!</h2>
        <div className="ride-info">
          <p><strong>Ride ID:</strong> <code>{rideId}</code></p>
          <p><strong>Name:</strong> {user.username}</p>
          <p><strong>Destination:</strong> {formData.destination}</p>
          <p><strong>Current Location:</strong> {formData.current_lat}, {formData.current_lng}</p>
        </div>

        {rideStatus && (
          <div className="ride-status">
            <h3>📊 Ride Status</h3>
            <p><strong>Total Matches:</strong> {rideStatus.match_count}</p>
            {rideStatus.has_new_matches && (
              <div className="notification">
                🎉 You have passenger requests!
              </div>
            )}
          </div>
        )}

        {matches.length > 0 && (
          <div className="matches-section">
            <h3>👥 Passenger Matches ({matches.length})</h3>
            
            {/* Map showing your route and passenger locations */}
            <div className="matches-map">
              <h4>🗺️ Your Route & Passengers</h4>
              <MapView
                center={[parseFloat(formData.current_lat) || config.defaultMapCenter.lat, parseFloat(formData.current_lng) || config.defaultMapCenter.lng]}
                zoom={12}
                markers={[
                  // Your current location
                  ...(formData.current_lat && formData.current_lng ? [{
                    latitude: parseFloat(formData.current_lat),
                    longitude: parseFloat(formData.current_lng),
                    title: "Your Current Location",
                    icon: "🚗",
                    color: "#28a745"
                  }] : []),
                  // Your destination
                  ...(formData.destination_lat && formData.destination_lng ? [{
                    latitude: parseFloat(formData.destination_lat),
                    longitude: parseFloat(formData.destination_lng),
                    title: "Your Destination",
                    icon: "🎯",
                    color: "#28a745"
                  }] : []),
                  // All matched passengers
                  ...matches.map((match, i) => ([
                    {
                      latitude: match.pickup_lat,
                      longitude: match.pickup_lng,
                      title: `${match.passenger_name}'s Pickup`,
                      description: `Pickup location for ${match.passenger_name}`,
                      icon: "🚶",
                      color: "#007bff"
                    },
                    {
                      latitude: match.meeting_lat,
                      longitude: match.meeting_lng,
                      title: `Meeting Point with ${match.passenger_name}`,
                      description: `Meet ${match.passenger_name} here`,
                      icon: "📍",
                      color: "#ffc107"
                    }
                  ])).flat()
                ]}
                routes={[
                  // Your main route
                  ...(formData.current_lat && formData.current_lng && formData.destination_lat && formData.destination_lng ? [{
                    start: { lat: parseFloat(formData.current_lat), lng: parseFloat(formData.current_lng) },
                    end: { lat: parseFloat(formData.destination_lat), lng: parseFloat(formData.destination_lng) },
                    color: "#28a745",
                    weight: 4,
                    title: "Your Route"
                  }] : []),
                  // Routes for each passenger to their destination
                  ...matches.map((match, i) => ({
                    start: { lat: match.pickup_lat, lng: match.pickup_lng },
                    end: { lat: match.destination_lat, lng: match.destination_lng },
                    color: "#007bff",
                    weight: 2,
                    opacity: 0.5,
                    title: `${match.passenger_name}'s Route`
                  }))
                ]}
                height="300px"
              />
            </div>

            {matches.map((match, index) => (
              <div key={match.id} className="passenger-card">
                <h4>🚶 {match.passenger_name}</h4>
                <div className="passenger-details">
                  <p><strong>Pickup:</strong> {match.pickup_lat.toFixed(4)}, {match.pickup_lng.toFixed(4)}</p>
                  <p><strong>Destination:</strong> {match.destination_lat.toFixed(4)}, {match.destination_lng.toFixed(4)}</p>
                  <p><strong>Meeting Point:</strong> {match.meeting_lat.toFixed(4)}, {match.meeting_lng.toFixed(4)}</p>
                  <p><strong>Max Walk Distance:</strong> {match.max_walk_distance}m</p>
                  <p><strong>Matched:</strong> {new Date(match.created_at).toLocaleString()}</p>
                </div>
                <div className="passenger-actions">
                  <p className="contact-info">Contact this passenger to coordinate pickup!</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {matches.length === 0 && rideStatus && (
          <div className="no-matches">
            <p>⏳ Waiting for passenger requests...</p>
            <p>Your ride is visible to passengers. They can find and request it.</p>
          </div>
        )}
      </div>
    )
  }

  const handleMapFirstViewSubmit = (type, data) => {
    console.log('RiderFlow received:', { type, data });
    console.log('User object:', user);
    if (type === 'offer') {
      // Handle ride offer submission
      const newFormData = {
        destination: data.destination.address,
        destination_lat: data.destination.lat.toString(),
        destination_lng: data.destination.lng.toString(),
        current_lat: data.pickup.lat.toString(),
        current_lng: data.pickup.lng.toString()
      };
      
      console.log('Creating ride with data:', newFormData);
      setFormData(newFormData);
      setCurrentLocationAddress(data.pickup.address);
      setDestinationAddress(data.destination.address);
      
      // Automatically submit the form
      submitRideOffer(newFormData);
    }
  };

  const submitRideOffer = async (rideFormData) => {
    setIsLoading(true);

    try {
      const rideData = {
        user_id: user.id,
        rider_name: user.username,
        destination: rideFormData.destination,
        destination_lat: parseFloat(rideFormData.destination_lat),
        destination_lng: parseFloat(rideFormData.destination_lng),
        current_lat: parseFloat(rideFormData.current_lat),
        current_lng: parseFloat(rideFormData.current_lng),
        status: 'active',
        created_at: new Date().toISOString()
      };

      // Try backend first
      try {
        const response = await fetch(`${config.apiBaseUrl}/api/rides`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(rideData)
        });

        const data = await response.json();
        if (response.ok) {
          setRideId(data.id);
          setRideStatus({ status: 'active', id: data.id });
          startPolling(data.id);
          return;
        }
      } catch (backendError) {
        console.log('Backend not available, using localStorage fallback');
      }

      // Fallback to localStorage
      const rideId = Date.now().toString();
      const rideWithId = { ...rideData, id: rideId };
      
      // Store ride in localStorage
      const storageKey = `active_rides_${user.id}`;
      const existingRides = JSON.parse(localStorage.getItem(storageKey) || '[]');
      const updatedRides = [...existingRides, rideWithId];
      localStorage.setItem(storageKey, JSON.stringify(updatedRides));
      
      // Update UI immediately
      setRideId(rideId);
      setRideStatus({ status: 'active', id: rideId, match_count: 0, has_new_matches: false });
      setMatches([]);
      
      alert('🚗 Ride offer created successfully! You\'re now waiting for passenger requests.');
      
    } catch (error) {
      console.error('Error creating ride:', error);
      alert('Error creating ride: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rider-flow">
      <MapFirstView
        user={user}
        journeyData={journeyData}
        onRideRequest={null} // Rider flow doesn't request rides
        onRideOffer={handleMapFirstViewSubmit}
      />
      
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-message">
            🚗 Creating your ride offer...
          </div>
        </div>
      )}
    </div>
  )
}

export default RiderFlow