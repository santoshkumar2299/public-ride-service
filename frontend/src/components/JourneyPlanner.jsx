import { useState, useEffect } from 'react'
import { LocationIcon, TargetIcon, CarIcon, WalkIcon, SearchIcon, CurrentLocationIcon, WorkIcon, HomeIcon } from './Icons'
import LocationInput from './LocationInput'

const JourneyPlanner = ({ user, onPlanJourney }) => {
  const [destination, setDestination] = useState(null)
  const [pickup, setPickup] = useState(null)
  const [showTransportOptions, setShowTransportOptions] = useState(false)
  const [currentStep, setCurrentStep] = useState('destination') // destination, pickup, transport, booking
  const [isDetectingLocation, setIsDetectingLocation] = useState(false)

  // Auto-detect current location when component mounts
  useEffect(() => {
    detectCurrentLocation()
  }, [])

  const detectCurrentLocation = async () => {
    setIsDetectingLocation(true)
    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const currentLocation = {
              type: 'current',
              coordinates: [position.coords.longitude, position.coords.latitude],
              address: 'Current Location',
              isCurrentLocation: true
            }
            setPickup(currentLocation)
            setIsDetectingLocation(false)
          },
          (error) => {
            console.error('Location detection failed:', error)
            setIsDetectingLocation(false)
          }
        )
      }
    } catch (error) {
      console.error('Geolocation error:', error)
      setIsDetectingLocation(false)
    }
  }

  const handleDestinationSelect = (location) => {
    const formattedLocation = {
      type: location.type || 'search',
      coordinates: [location.lng || location.lon, location.lat],
      address: location.address
    }
    
    setDestination(formattedLocation)
    setCurrentStep('pickup')
    // If we don't have pickup location, focus on that
    if (!pickup) {
      detectCurrentLocation()
    } else {
      // If we have both, move to transport options
      setCurrentStep('transport')
      setShowTransportOptions(true)
    }
  }

  const handlePickupSelect = (location) => {
    const formattedLocation = {
      type: location.type || 'search',
      coordinates: [location.lng || location.lon, location.lat],
      address: location.address,
      isCurrentLocation: location.type === 'current'
    }
    
    setPickup(formattedLocation)
    if (destination) {
      setCurrentStep('transport')
      setShowTransportOptions(true)
    }
  }

  const calculateDistance = () => {
    if (!pickup || !destination) return null
    
    // Simple distance calculation (in reality, you'd use a proper mapping service)
    const [lon1, lat1] = pickup.coordinates
    const [lon2, lat2] = destination.coordinates
    
    const R = 6371 // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    const distance = R * c
    
    return distance
  }

  const getTransportSuggestions = () => {
    const distance = calculateDistance()
    if (!distance) return []

    const suggestions = []
    
    // Walking suggestion for short distances
    if (distance <= 2) {
      suggestions.push({
        type: 'walk',
        icon: WalkIcon,
        title: 'Walk',
        subtitle: `${Math.round(distance * 1000)}m • ${Math.round(distance * 12)} min`,
        color: '#28a745',
        recommended: distance <= 0.5
      })
    }

    // Ride sharing options for longer distances
    if (distance > 0.5) {
      suggestions.push({
        type: 'request-ride',
        icon: CarIcon,
        title: 'Request a Ride',
        subtitle: `${distance.toFixed(1)}km • ${Math.round(distance * 3)} min`,
        color: '#007bff',
        recommended: distance > 0.5 && distance < 20,
        price: `$${(3 + distance * 1.5).toFixed(0)}`,
        description: 'Looking for someone to drive you'
      })

      suggestions.push({
        type: 'offer-ride',
        icon: CarIcon,
        title: 'Offer a Ride',
        subtitle: `${distance.toFixed(1)}km • ${Math.round(distance * 3)} min`,
        color: '#28a745',
        recommended: false,
        price: `Earn $${(2 + distance * 1.2).toFixed(0)}`,
        description: 'Drive and pick up passengers'
      })
    }

    return suggestions
  }

  const handleTransportSelect = (transport) => {
    const journeyData = {
      pickup,
      destination,
      transport,
      distance: calculateDistance(),
      user
    }
    
    onPlanJourney(journeyData)
  }

  const getQuickDestinations = () => [
    {
      type: 'home',
      icon: HomeIcon,
      title: 'Home',
      subtitle: 'Your home address',
      coordinates: [-122.4194, 37.7749] // Sample coordinates
    },
    {
      type: 'work',
      icon: WorkIcon,
      title: 'Work',
      subtitle: 'Your workplace',
      coordinates: [-122.4094, 37.7849] // Sample coordinates
    }
  ]

  return (
    <div className="journey-planner">
      <div className="journey-header">
        <h2>Where are you going?</h2>
        <p>Let's plan your journey</p>
      </div>

      <div className="journey-steps">
        {/* Step 1: Destination Input */}
        <div className={`journey-step ${currentStep === 'destination' ? 'active' : 'completed'}`}>
          <div className="step-header">
            <TargetIcon size={20} color={destination ? '#28a745' : '#007bff'} />
            <h3>Destination</h3>
          </div>
          
          <LocationInput
            label="Where to?"
            placeholder="Enter your destination"
            address={destination?.address}
            value={destination}
            onLocationSelect={handleDestinationSelect}
            type="destination"
          />

          {currentStep === 'destination' && (
            <div className="quick-destinations">
              <h4>Quick destinations</h4>
              <div className="quick-dest-grid">
                {getQuickDestinations().map((dest, index) => (
                  <button
                    key={index}
                    className="quick-dest-btn"
                    onClick={() => handleDestinationSelect({
                      lat: dest.coordinates[1],
                      lng: dest.coordinates[0],
                      address: dest.title,
                      type: dest.type
                    })}
                  >
                    <dest.icon size={24} color="#007bff" />
                    <div className="quick-dest-text">
                      <span className="dest-title">{dest.title}</span>
                      <span className="dest-subtitle">{dest.subtitle}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Pickup Location */}
        {(destination || currentStep !== 'destination') && (
          <div className={`journey-step ${currentStep === 'pickup' ? 'active' : currentStep === 'transport' ? 'completed' : ''}`}>
            <div className="step-header">
              <LocationIcon size={20} color={pickup ? '#28a745' : '#007bff'} />
              <h3>Pickup Location</h3>
            </div>

            <LocationInput
              label="From"
              placeholder="Where are you?"
              address={pickup?.address}
              value={pickup}
              onLocationSelect={handlePickupSelect}
              type="pickup"
            />
          </div>
        )}

        {/* Step 3: Transport Options */}
        {showTransportOptions && pickup && destination && (
          <div className={`journey-step ${currentStep === 'transport' ? 'active' : ''}`}>
            <div className="step-header">
              <CarIcon size={20} color="#007bff" />
              <h3>How would you like to travel?</h3>
            </div>

            <div className="transport-options">
              {getTransportSuggestions().map((transport, index) => (
                <button
                  key={index}
                  className={`transport-option ${transport.recommended ? 'recommended' : ''}`}
                  onClick={() => handleTransportSelect(transport)}
                >
                  <div className="transport-icon">
                    <transport.icon size={32} color={transport.color} />
                  </div>
                  <div className="transport-info">
                    <div className="transport-header">
                      <h4>{transport.title}</h4>
                      {transport.recommended && (
                        <span className="recommended-badge">Recommended</span>
                      )}
                    </div>
                    <p className="transport-details">{transport.subtitle}</p>
                    {transport.price && (
                      <p className="transport-price">{transport.price}</p>
                    )}
                  </div>
                  <div className="transport-arrow">
                    <span>→</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default JourneyPlanner