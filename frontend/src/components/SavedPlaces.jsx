import { useState, useEffect } from 'react'
import { HomeIcon, WorkIcon, LocationIcon, TrashIcon, EditIcon, PlusIcon, StarIcon, ClockIcon } from './Icons'
import { config } from '../config/env'
import LocationInput from './LocationInput'

function SavedPlaces({ user }) {
  const [savedPlaces, setSavedPlaces] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingPlace, setEditingPlace] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newPlace, setNewPlace] = useState({
    name: '',
    address: '',
    coordinates: null,
    type: 'favorite'
  })

  useEffect(() => {
    loadSavedPlaces()
  }, [user.id])

  const loadSavedPlaces = async () => {
    try {
      setIsLoading(true)
      
      // Try to load from backend first
      try {
        const response = await fetch(`${config.apiBaseUrl}/api/users/${user.id}/saved-places`)
        if (response.ok) {
          const data = await response.json()
          setSavedPlaces(data.places || [])
          setIsLoading(false)
          return
        }
      } catch (backendError) {
        console.log('Backend not available, using localStorage fallback')
      }
      
      // Fallback to localStorage
      const storageKey = `saved_places_${user.id}`
      const savedData = localStorage.getItem(storageKey)
      if (savedData) {
        const places = JSON.parse(savedData)
        setSavedPlaces(places)
      } else {
        setSavedPlaces([])
      }
    } catch (error) {
      console.error('Failed to load saved places:', error)
      setSavedPlaces([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleLocationSelect = (locationData) => {
    console.log('Location selected:', locationData)
    setNewPlace(prev => ({
      ...prev,
      address: locationData.address,
      coordinates: {
        lat: locationData.lat,
        lng: locationData.lng
      }
    }))
  }

  const savePlace = async () => {
    console.log('Attempting to save place:', newPlace)
    
    if (!newPlace.name) {
      alert('Please enter a name for this place')
      return
    }
    
    if (!newPlace.address || !newPlace.coordinates) {
      alert('Please select a location using the location picker')
      return
    }

    try {
      const placeData = {
        id: Date.now().toString(), // Generate unique ID
        name: newPlace.name,
        address: newPlace.address,
        lat: newPlace.coordinates.lat,
        lng: newPlace.coordinates.lng,
        type: newPlace.type,
        usage_count: 0,
        created_at: new Date().toISOString()
      }

      // Try to save to backend first
      try {
        const response = await fetch(`${config.apiBaseUrl}/api/users/${user.id}/saved-places`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(placeData)
        })
        
        if (response.ok) {
          await loadSavedPlaces() // Refresh from backend
          setShowAddForm(false)
          setNewPlace({ name: '', address: '', coordinates: null, type: 'favorite' })
          return
        }
      } catch (backendError) {
        console.log('Backend not available, saving to localStorage')
      }

      // Fallback to localStorage
      const storageKey = `saved_places_${user.id}`
      const existingPlaces = JSON.parse(localStorage.getItem(storageKey) || '[]')
      const updatedPlaces = [...existingPlaces, placeData]
      localStorage.setItem(storageKey, JSON.stringify(updatedPlaces))
      
      // Update state immediately
      setSavedPlaces(updatedPlaces)
      setShowAddForm(false)
      setNewPlace({ name: '', address: '', coordinates: null, type: 'favorite' })
      
      alert('Place saved successfully!')
      
    } catch (error) {
      console.error('Failed to save place:', error)
      alert('Failed to save place. Please try again.')
    }
  }

  const deletePlace = async (placeId) => {
    if (!confirm('Remove this saved place?')) return
    
    try {
      // Try to delete from backend first
      try {
        const response = await fetch(`${config.apiBaseUrl}/api/users/${user.id}/saved-places/${placeId}`, {
          method: 'DELETE'
        })
        
        if (response.ok) {
          await loadSavedPlaces()
          return
        }
      } catch (backendError) {
        console.log('Backend not available, deleting from localStorage')
      }

      // Fallback to localStorage
      const storageKey = `saved_places_${user.id}`
      const existingPlaces = JSON.parse(localStorage.getItem(storageKey) || '[]')
      const updatedPlaces = existingPlaces.filter(place => place.id !== placeId)
      localStorage.setItem(storageKey, JSON.stringify(updatedPlaces))
      
      // Update state immediately
      setSavedPlaces(updatedPlaces)
      
    } catch (error) {
      console.error('Failed to delete place:', error)
      alert('Failed to delete place. Please try again.')
    }
  }

  const getPlaceIcon = (type) => {
    switch (type) {
      case 'home': return HomeIcon
      case 'work': return WorkIcon
      case 'frequent': return ClockIcon
      case 'favorite': 
      default: return StarIcon
    }
  }

  const getPlaceTypeLabel = (type) => {
    switch (type) {
      case 'home': return 'Home'
      case 'work': return 'Work'
      case 'frequent': return 'Frequent'
      case 'favorite': 
      default: return 'Favorite'
    }
  }

  const groupedPlaces = savedPlaces.reduce((groups, place) => {
    const type = place.type || 'favorite'
    if (!groups[type]) groups[type] = []
    groups[type].push(place)
    return groups
  }, {})

  if (isLoading) {
    return (
      <div className="saved-places loading">
        <div className="loading-skeleton">Loading saved places...</div>
      </div>
    )
  }

  return (
    <div className="saved-places">
      <div className="saved-places-header">
        <h2>📍 Saved Places</h2>
        <p>Quick access to your favorite and frequent locations</p>
        <button 
          className="add-place-btn"
          onClick={() => setShowAddForm(true)}
        >
          <PlusIcon size={20} />
          <span>Add Place</span>
        </button>
      </div>

      {showAddForm && (
        <div className="add-place-form">
          <h3>Add New Place</h3>
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              value={newPlace.name}
              onChange={(e) => setNewPlace({...newPlace, name: e.target.value})}
              placeholder="e.g., Mom's House, Gym, Coffee Shop"
            />
          </div>
          
          <div className="form-group">
            <LocationInput
              label="Location"
              placeholder="Search for the location"
              address={newPlace.address}
              onLocationSelect={handleLocationSelect}
              type="destination"
              variant="compact"
            />
          </div>
          
          <div className="form-group">
            <label>Type</label>
            <select
              value={newPlace.type}
              onChange={(e) => setNewPlace({...newPlace, type: e.target.value})}
            >
              <option value="favorite">⭐ Favorite</option>
              <option value="home">🏠 Home</option>
              <option value="work">💼 Work</option>
            </select>
          </div>
          <div className="form-actions">
            <button 
              className="cancel-btn"
              onClick={() => {
                setShowAddForm(false)
                setNewPlace({ name: '', address: '', coordinates: null, type: 'favorite' })
              }}
            >
              Cancel
            </button>
            <button 
              className="save-btn"
              onClick={savePlace}
              disabled={!newPlace.name || !newPlace.address || !newPlace.coordinates}
            >
              Save Place
            </button>
          </div>
        </div>
      )}

      <div className="places-list">
        {Object.keys(groupedPlaces).length === 0 ? (
          <div className="empty-state">
            <LocationIcon size={48} color="#ccc" />
            <h3>No saved places yet</h3>
            <p>Add your home, work, or favorite locations for quick access when planning trips.</p>
          </div>
        ) : (
          Object.entries(groupedPlaces).map(([type, places]) => (
            <div key={type} className="place-group">
              <h3 className="group-title">
                {React.createElement(getPlaceIcon(type), { size: 20 })}
                <span>{getPlaceTypeLabel(type)}</span>
                <span className="place-count">({places.length})</span>
              </h3>
              
              <div className="places-grid">
                {places.map((place) => (
                  <div key={place.id} className="place-card">
                    <div className="place-info">
                      <div className="place-icon">
                        {React.createElement(getPlaceIcon(place.type), { 
                          size: 24, 
                          color: '#007bff' 
                        })}
                      </div>
                      <div className="place-details">
                        <h4 className="place-name">{place.name}</h4>
                        <p className="place-address">{place.address}</p>
                        {place.usage_count > 0 && (
                          <p className="place-usage">Used {place.usage_count} times</p>
                        )}
                      </div>
                    </div>
                    <div className="place-actions">
                      <button 
                        className="edit-btn"
                        onClick={() => setEditingPlace(place)}
                        title="Edit place"
                      >
                        <EditIcon size={16} />
                      </button>
                      <button 
                        className="delete-btn"
                        onClick={() => deletePlace(place.id)}
                        title="Remove place"
                      >
                        <TrashIcon size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Usage Tips */}
      <div className="usage-tips">
        <h3>💡 Tips</h3>
        <ul>
          <li><strong>Home & Work:</strong> Set these for one-tap access in ride planning</li>
          <li><strong>Favorites:</strong> Save places you visit regularly</li>
          <li><strong>Auto-suggestion:</strong> We'll suggest places you visit frequently</li>
        </ul>
      </div>
    </div>
  )
}

export default SavedPlaces