import { useState, useEffect } from 'react'
import LocationPicker from './LocationPicker'
import MapView from './MapView'
import { config } from '../config/env'

function RiderFlow() {
  const [formData, setFormData] = useState({
    rider_name: '',
    destination: '',
    destination_lat: '',
    destination_lng: '',
    current_lat: '',
    current_lng: ''
  })
  const [rideId, setRideId] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [matches, setMatches] = useState([])
  const [rideStatus, setRideStatus] = useState(null)
  const [pollingInterval, setPollingInterval] = useState(null)

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

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({
            ...formData,
            current_lat: position.coords.latitude.toString(),
            current_lng: position.coords.longitude.toString()
          })
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
          <p><strong>Name:</strong> {formData.rider_name}</p>
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

  return (
    <div className="rider-flow">
      <h2>🚗 Offer a Ride</h2>
      <form onSubmit={handleSubmit} className="ride-form">
        <div className="form-group">
          <label htmlFor="rider_name">Your Name:</label>
          <input
            type="text"
            id="rider_name"
            name="rider_name"
            value={formData.rider_name}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="destination">Destination:</label>
          <input
            type="text"
            id="destination"
            name="destination"
            value={formData.destination}
            onChange={handleInputChange}
            placeholder="e.g., Downtown Office Building"
            required
          />
        </div>

        <LocationPicker
          title="📍 Destination Location"
          latValue={formData.destination_lat}
          lngValue={formData.destination_lng}
          onLatChange={handleInputChange}
          onLngChange={handleInputChange}
          onCoordinateUpdate={handleCoordinateUpdate}
          latName="destination_lat"
          lngName="destination_lng"
          latLabel="Destination Latitude"
          lngLabel="Destination Longitude"
          latPlaceholder="e.g., 37.7749"
          lngPlaceholder="e.g., -122.4194"
          required
        />

        <div className="location-section">
          <button type="button" onClick={getCurrentLocation} className="location-btn">
            📍 Get My Current Location
          </button>
          
          <LocationPicker
            title="📍 Current Location"
            latValue={formData.current_lat}
            lngValue={formData.current_lng}
            onLatChange={handleInputChange}
            onLngChange={handleInputChange}
            onCoordinateUpdate={handleCoordinateUpdate}
            latName="current_lat"
            lngName="current_lng"
            latLabel="Current Latitude"
            lngLabel="Current Longitude"
            latPlaceholder="e.g., 37.7849"
            lngPlaceholder="e.g., -122.4094"
            required
          />
        </div>

        <button type="submit" disabled={isLoading} className="submit-btn">
          {isLoading ? 'Creating Ride...' : 'Create Ride'}
        </button>
      </form>
    </div>
  )
}

export default RiderFlow