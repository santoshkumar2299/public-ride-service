import { useState } from 'react'
import LocationPicker from './LocationPicker'
import MapView from './MapView'
import { config } from '../config/env'

function PassengerFlow() {
  const [step, setStep] = useState('request') // 'request' or 'matches'
  const [formData, setFormData] = useState({
    passenger_name: '',
    pickup_lat: '',
    pickup_lng: '',
    destination_lat: '',
    destination_lng: '',
    max_walk_distance: config.defaultWalkDistance.toString()
  })
  const [requestId, setRequestId] = useState(null)
  const [matches, setMatches] = useState([])
  const [isLoading, setIsLoading] = useState(false)

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
            pickup_lat: position.coords.latitude.toString(),
            pickup_lng: position.coords.longitude.toString()
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
      const response = await fetch(`${config.apiBaseUrl}/api/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          pickup_lat: parseFloat(formData.pickup_lat),
          pickup_lng: parseFloat(formData.pickup_lng),
          destination_lat: parseFloat(formData.destination_lat),
          destination_lng: parseFloat(formData.destination_lng),
          max_walk_distance: parseInt(formData.max_walk_distance)
        })
      })

      const data = await response.json()
      if (response.ok) {
        setRequestId(data.id)
        await findMatches(data.id)
      } else {
        alert('Error creating request: ' + data.error)
      }
    } catch (error) {
      alert('Error: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const findMatches = async (passengerId) => {
    try {
      const response = await fetch(`${config.apiBaseUrl}/api/matches?passengerId=${passengerId}`)
      const data = await response.json()
      if (response.ok) {
        setMatches(data.matches)
        setStep('matches')
      } else {
        alert('Error finding matches: ' + data.error)
      }
    } catch (error) {
      alert('Error: ' + error.message)
    }
  }

  const selectRide = async (ride, meetingPoint) => {
    try {
      const response = await fetch(`${config.apiBaseUrl}/api/matches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ride_id: ride.id,
          request_id: requestId,
          meeting_lat: meetingPoint.lat,
          meeting_lng: meetingPoint.lng
        })
      })

      const data = await response.json()
      if (response.ok) {
        alert('Match confirmed! Contact your rider.')
      } else {
        alert('Error creating match: ' + data.error)
      }
    } catch (error) {
      alert('Error: ' + error.message)
    }
  }

  if (step === 'matches') {
    return (
      <div className="matches-view">
        <h2>🔍 Available Rides</h2>
        {matches.length === 0 ? (
          <div className="no-matches">
            <p>No matching rides found at the moment.</p>
            <button onClick={() => setStep('request')} className="back-btn">
              ← Create New Request
            </button>
          </div>
        ) : (
          <div className="matches-list">
            <p>Found {matches.length} matching ride(s):</p>
            
            {/* Map showing all matches */}
            <div className="matches-map">
              <h4>🗺️ Rides Near You</h4>
              <MapView
                center={[parseFloat(formData.pickup_lat) || config.defaultMapCenter.lat, parseFloat(formData.pickup_lng) || config.defaultMapCenter.lng]}
                zoom={12}
                markers={[
                  // Your pickup location
                  ...(formData.pickup_lat && formData.pickup_lng ? [{
                    latitude: parseFloat(formData.pickup_lat),
                    longitude: parseFloat(formData.pickup_lng),
                    title: "Your Pickup Location",
                    icon: "🚶",
                    color: "#007bff"
                  }] : []),
                  // Your destination
                  ...(formData.destination_lat && formData.destination_lng ? [{
                    latitude: parseFloat(formData.destination_lat),
                    longitude: parseFloat(formData.destination_lng),
                    title: "Your Destination",
                    icon: "🎯",
                    color: "#28a745"
                  }] : []),
                  // All matching rides
                  ...matches.map((match, i) => ({
                    latitude: match.ride.current_lat,
                    longitude: match.ride.current_lng,
                    title: `${match.ride.rider_name}'s Ride`,
                    description: `Going to: ${match.ride.destination}`,
                    icon: "🚗",
                    color: "#dc3545"
                  }))
                ]}
                routes={[
                  // Your route from pickup to destination
                  ...(formData.pickup_lat && formData.pickup_lng && formData.destination_lat && formData.destination_lng ? [{
                    start: { lat: parseFloat(formData.pickup_lat), lng: parseFloat(formData.pickup_lng) },
                    end: { lat: parseFloat(formData.destination_lat), lng: parseFloat(formData.destination_lng) },
                    color: "#007bff",
                    weight: 4,
                    title: "Your Route"
                  }] : []),
                  // Routes for each matching ride
                  ...matches.map((match, i) => ({
                    start: { lat: match.ride.current_lat, lng: match.ride.current_lng },
                    end: { lat: match.ride.destination_lat, lng: match.ride.destination_lng },
                    color: "#dc3545",
                    weight: 3,
                    opacity: 0.6,
                    title: `${match.ride.rider_name}'s Route`
                  }))
                ]}
                height="300px"
              />
            </div>

            {matches.map((match, index) => (
              <div key={index} className="match-card">
                <h3>🚗 {match.ride.rider_name}</h3>
                <p><strong>Going to:</strong> {match.ride.destination}</p>
                <p><strong>Distance to meeting point:</strong> {Math.round(match.distance)}m</p>
                <p><strong>Direction similarity:</strong> {Math.round(match.bearing_similarity)}%</p>
                <p><strong>Meeting point:</strong> {match.meeting_point.lat.toFixed(4)}, {match.meeting_point.lng.toFixed(4)}</p>
                <button 
                  onClick={() => selectRide(match.ride, match.meeting_point)}
                  className="select-btn"
                >
                  Select This Ride
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="passenger-flow">
      <h2>🚶 Request a Ride</h2>
      <form onSubmit={handleSubmit} className="request-form">
        <div className="form-group">
          <label htmlFor="passenger_name">Your Name:</label>
          <input
            type="text"
            id="passenger_name"
            name="passenger_name"
            value={formData.passenger_name}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="location-section">
          <h3>Pickup Location:</h3>
          <button type="button" onClick={getCurrentLocation} className="location-btn">
            📍 Use My Current Location
          </button>
          
          <LocationPicker
            title="📍 Pickup Location"
            latValue={formData.pickup_lat}
            lngValue={formData.pickup_lng}
            onLatChange={handleInputChange}
            onLngChange={handleInputChange}
            onCoordinateUpdate={handleCoordinateUpdate}
            latName="pickup_lat"
            lngName="pickup_lng"
            latLabel="Pickup Latitude"
            lngLabel="Pickup Longitude"
            latPlaceholder="e.g., 37.7749"
            lngPlaceholder="e.g., -122.4194"
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
          latPlaceholder="e.g., 37.7849"
          lngPlaceholder="e.g., -122.4094"
          required
        />

        <div className="form-group">
          <label htmlFor="max_walk_distance">Maximum walking distance (meters):</label>
          <select
            id="max_walk_distance"
            name="max_walk_distance"
            value={formData.max_walk_distance}
            onChange={handleInputChange}
          >
            <option value="500">500m (5 min walk)</option>
            <option value={config.defaultWalkDistance}>{config.defaultWalkDistance}m (10 min walk)</option>
            <option value="1500">1500m (15 min walk)</option>
            <option value={config.maxWalkDistance}>{config.maxWalkDistance}m (20 min walk)</option>
          </select>
        </div>

        <button type="submit" disabled={isLoading} className="submit-btn">
          {isLoading ? 'Finding Rides...' : 'Find Matching Rides'}
        </button>
      </form>
    </div>
  )
}

export default PassengerFlow