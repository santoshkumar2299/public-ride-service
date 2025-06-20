import { useState, useEffect } from 'react'
import MapFirstView from './MapFirstView'
import MapView from './MapView'
import { config } from '../config/env'
import { WalkIcon, SearchIcon, LocationIcon, TargetIcon, CarIcon, ArrowLeftIcon } from './Icons'

function PassengerFlow({ user, journeyData }) {
  // If journeyData is provided, we can skip the request form and go to matches
  const [step, setStep] = useState(journeyData ? 'matches' : 'request') // 'request' or 'matches'
  const [formData, setFormData] = useState({
    pickup_lat: journeyData?.pickup?.coordinates?.[1] || '',
    pickup_lng: journeyData?.pickup?.coordinates?.[0] || '',
    destination_lat: journeyData?.destination?.coordinates?.[1] || '',
    destination_lng: journeyData?.destination?.coordinates?.[0] || '',
    max_walk_distance: config.defaultWalkDistance.toString()
  })
  const [requestId, setRequestId] = useState(null)
  const [matches, setMatches] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [pickupAddress, setPickupAddress] = useState(journeyData?.pickup?.address || '')
  const [destinationAddress, setDestinationAddress] = useState(journeyData?.destination?.address || '')
  const [modalState, setModalState] = useState({ isOpen: false, mode: 'search', type: 'pickup' })

  // Auto-search for matches when journeyData is provided
  useEffect(() => {
    if (journeyData && step === 'matches' && formData.pickup_lat && formData.destination_lat) {
      // Automatically search for matches
      handleSubmit({ preventDefault: () => {} })
    }
  }, [journeyData])

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
    
    if (modalState.type === 'pickup') {
      setFormData(prev => ({
        ...prev,
        pickup_lat: lat.toString(),
        pickup_lng: lng.toString()
      }));
      setPickupAddress(address);
    } else {
      setFormData(prev => ({
        ...prev,
        destination_lat: lat.toString(),
        destination_lng: lng.toString()
      }));
      setDestinationAddress(address);
    }

    setModalState({ isOpen: false, mode: 'search', type: 'pickup' });
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({
            ...formData,
            pickup_lat: position.coords.latitude.toString(),
            pickup_lng: position.coords.longitude.toString()
          })
          setPickupAddress('Current location');
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
          passenger_name: user.username,
          user_id: user.id,
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
        <h2><SearchIcon size={24} /> Available Rides</h2>
        {matches.length === 0 ? (
          <div className="no-matches">
            <p>No matching rides found at the moment.</p>
            <button onClick={() => setStep('request')} className="back-btn">
              <ArrowLeftIcon size={20} /> Create New Request
            </button>
          </div>
        ) : (
          <div className="matches-list">
            <p>Found {matches.length} matching ride(s):</p>
            
            {/* Map showing all matches */}
            <div className="matches-map">
              <h4><LocationIcon size={20} /> Rides Near You</h4>
              <MapView
                center={[parseFloat(formData.pickup_lat) || config.defaultMapCenter.lat, parseFloat(formData.pickup_lng) || config.defaultMapCenter.lng]}
                zoom={12}
                markers={[
                  // Your pickup location
                  ...(formData.pickup_lat && formData.pickup_lng ? [{
                    latitude: parseFloat(formData.pickup_lat),
                    longitude: parseFloat(formData.pickup_lng),
                    title: "Your Pickup Location",
                    icon: "pickup",
                    color: "#007bff"
                  }] : []),
                  // Your destination
                  ...(formData.destination_lat && formData.destination_lng ? [{
                    latitude: parseFloat(formData.destination_lat),
                    longitude: parseFloat(formData.destination_lng),
                    title: "Your Destination",
                    icon: "destination",
                    color: "#28a745"
                  }] : []),
                  // All matching rides
                  ...matches.map((match, i) => ({
                    latitude: match.ride.current_lat,
                    longitude: match.ride.current_lng,
                    title: `${match.ride.rider_name}'s Ride`,
                    description: `Going to: ${match.ride.destination}`,
                    icon: "car",
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
                <h3><CarIcon size={20} /> {match.ride.rider_name}</h3>
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

  const handleMapFirstViewSubmit = (type, data) => {
    if (type === 'request') {
      // Handle ride request submission
      const newFormData = {
        pickup_lat: data.pickup.lat.toString(),
        pickup_lng: data.pickup.lng.toString(),
        destination_lat: data.destination.lat.toString(),
        destination_lng: data.destination.lng.toString(),
        max_walk_distance: config.defaultWalkDistance.toString()
      };
      
      setFormData(newFormData);
      setPickupAddress(data.pickup.address);
      setDestinationAddress(data.destination.address);
      
      // Automatically submit the form
      submitRequest(newFormData, data.pickup.address, data.destination.address);
    }
  };

  const submitRequest = async (requestFormData, pickupAddr, destinationAddr) => {
    setIsLoading(true);

    try {
      const response = await fetch(`${config.apiBaseUrl}/api/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...requestFormData,
          passenger_name: user.username,
          user_id: user.id,
          pickup_lat: parseFloat(requestFormData.pickup_lat),
          pickup_lng: parseFloat(requestFormData.pickup_lng),
          destination_lat: parseFloat(requestFormData.destination_lat),
          destination_lng: parseFloat(requestFormData.destination_lng),
          max_walk_distance: parseInt(requestFormData.max_walk_distance)
        })
      });

      const data = await response.json();
      if (response.ok) {
        setRequestId(data.id);
        await findMatches(data.id);
      } else {
        alert('Error creating request: ' + data.error);
      }
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="passenger-flow">
      <MapFirstView
        user={user}
        journeyData={journeyData}
        onRideRequest={handleMapFirstViewSubmit}
        onRideOffer={null} // Passenger flow doesn't offer rides
      />
      
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-message">
            🔍 Finding matching rides...
          </div>
        </div>
      )}
    </div>
  )
}

export default PassengerFlow