import { useState, useRef, useEffect } from 'react';

function LocationSearch({ onLocationSelect, placeholder = "Search for a location...", referenceLocation = null, fastMode = false }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [detectedCity, setDetectedCity] = useState(null);
  const [searchArea, setSearchArea] = useState(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const searchTimeoutRef = useRef(null);
  const inputRef = useRef(null);

  // Extract city information from Nominatim address
  const extractCityInfo = (displayName) => {
    // Parse display name to extract city/region information
    const parts = displayName.split(',').map(part => part.trim());
    
    // Common patterns for city extraction
    let city = null;
    let region = null;
    let country = null;
    
    if (parts.length >= 2) {
      // Usually: "Place, City, State, Country" or "Place, City, Country"
      city = parts[1];
      if (parts.length >= 3) {
        region = parts[2];
      }
      if (parts.length >= 4) {
        country = parts[3];
      } else if (parts.length === 3) {
        country = parts[2];
      }
    }
    
    return { city, region, country, fullAddress: displayName };
  };

  // Auto-detect city from reference location
  useEffect(() => {
    if (referenceLocation && !detectedCity) {
      // Reverse geocode reference location to detect city
      const detectCity = async () => {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?` + 
            new URLSearchParams({
              lat: referenceLocation.lat.toString(),
              lon: referenceLocation.lng.toString(),
              format: 'json',
              addressdetails: '1',
              'accept-language': 'en'
            }),
            {
              headers: {
                'User-Agent': 'RideShareMVP/1.0'
              }
            }
          );

          if (response.ok) {
            const data = await response.json();
            const cityInfo = extractCityInfo(data.display_name);
            setDetectedCity(cityInfo);
            
            // Set search area bounds (approximate 50km radius)
            const radius = 0.45; // roughly 50km in degrees
            setSearchArea({
              north: referenceLocation.lat + radius,
              south: referenceLocation.lat - radius,
              east: referenceLocation.lng + radius,
              west: referenceLocation.lng - radius
            });
          }
        } catch (error) {
          console.error('City detection error:', error);
        }
      };

      detectCity();
    }
  }, [referenceLocation, detectedCity]);

  // Filter results by city context
  const filterByCity = (results) => {
    if (!detectedCity || !detectedCity.city) {
      return results; // No city context, return all results
    }

    const cityKeywords = [detectedCity.city.toLowerCase()];
    
    // Add variations (e.g., "New Delhi" -> ["new delhi", "delhi"])
    if (detectedCity.city.includes(' ')) {
      const words = detectedCity.city.toLowerCase().split(' ');
      cityKeywords.push(...words);
    }

    // Filter results that contain city keywords
    const localResults = results.filter(result => {
      const displayNameLower = result.display_name.toLowerCase();
      return cityKeywords.some(keyword => displayNameLower.includes(keyword));
    });

    // If we have local results, return them. Otherwise, return all results with a note.
    return localResults.length > 0 ? localResults : results;
  };

  // Debounced search function
  const searchLocation = async (searchQuery) => {
    if (!searchQuery.trim() || searchQuery.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      // Build search parameters
      const searchParams = {
        q: searchQuery,
        format: 'json',
        limit: '10', // Increased limit to allow for filtering
        addressdetails: '1',
        'accept-language': 'en'
      };

      // Add bounding box if we have search area
      if (searchArea) {
        searchParams.viewbox = `${searchArea.west},${searchArea.south},${searchArea.east},${searchArea.north}`;
        searchParams.bounded = '1'; // Restrict to viewbox
      }

      // Using Nominatim API (OpenStreetMap's geocoding service)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` + 
        new URLSearchParams(searchParams),
        {
          headers: {
            'User-Agent': 'RideShareMVP/1.0'  // Required by Nominatim
          }
        }
      );

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      const formattedResults = data.map(item => ({
        id: item.place_id,
        display_name: item.display_name,
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
        type: item.type,
        importance: item.importance || 0
      }));

      // Filter results by city context
      const cityFilteredResults = filterByCity(formattedResults);
      
      // Limit to top 5 results after filtering
      const finalResults = cityFilteredResults.slice(0, 5);

      setSuggestions(finalResults);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Location search error:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedIndex(-1);

    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for debounced search
    searchTimeoutRef.current = setTimeout(() => {
      searchLocation(value);
    }, 300); // 300ms debounce
  };

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion.display_name);
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    
    // Call the callback with the selected location
    onLocationSelect({
      lat: suggestion.lat,
      lng: suggestion.lon,
      address: suggestion.display_name,
      type: suggestion.type
    });
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleBlur = () => {
    // Delay hiding suggestions to allow click events
    setTimeout(() => {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }, 200);
  };

  const handleFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };
  
  const handleUseCurrentLocation = () => {
    setIsGettingLocation(true);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          
          try {
            // Reverse geocode to get address
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?` + 
              new URLSearchParams({
                lat: location.lat.toString(),
                lon: location.lng.toString(),
                format: 'json',
                addressdetails: '1',
                'accept-language': 'en'
              }),
              {
                headers: {
                  'User-Agent': 'RideShareMVP/1.0'
                }
              }
            );
            
            if (response.ok) {
              const data = await response.json();
              setQuery('Current Location');
              onLocationSelect({
                lat: location.lat,
                lng: location.lng,
                address: data.display_name || 'Current Location',
                type: 'current_location'
              });
            } else {
              // Fallback if reverse geocoding fails
              setQuery('Current Location');
              onLocationSelect({
                lat: location.lat,
                lng: location.lng,
                address: 'Current Location',
                type: 'current_location'
              });
            }
          } catch (error) {
            console.error('Reverse geocoding error:', error);
            // Still use the coordinates even if reverse geocoding fails
            setQuery('Current Location');
            onLocationSelect({
              lat: location.lat,
              lng: location.lng,
              address: 'Current Location',
              type: 'current_location'
            });
          } finally {
            setIsGettingLocation(false);
            setSuggestions([]);
            setShowSuggestions(false);
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          setIsGettingLocation(false);
          
          // Show user-friendly error message
          let errorMessage = 'Unable to access location';
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied. Please enable location permissions.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out.';
              break;
          }
          alert(errorMessage);
        },
        {
          timeout: 10000,
          enableHighAccuracy: true,
          maximumAge: 300000 // 5 minutes
        }
      );
    } else {
      setIsGettingLocation(false);
      alert('Geolocation is not supported by this browser.');
    }
  };

  const getLocationIcon = (type) => {
    const icons = {
      'city': '🏙️',
      'town': '🏘️',
      'village': '🏡',
      'house': '🏠',
      'building': '🏢',
      'restaurant': '🍽️',
      'hotel': '🏨',
      'hospital': '🏥',
      'school': '🏫',
      'university': '🎓',
      'airport': '✈️',
      'railway': '🚂',
      'bus_stop': '🚌',
      'park': '🌳',
      'museum': '🏛️',
      'shopping': '🛒'
    };
    return icons[type] || '📍';
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className={`location-search ${fastMode ? 'fast-mode' : ''}`}>
      <div className="search-input-container">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onFocus={handleFocus}
          placeholder={placeholder}
          className="search-input"
        />
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="search-loading">
            <span className="loading-spinner">🔄</span>
          </div>
        )}
        
        {/* Current Location button */}
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          className="search-current-location"
          title="Use current location"
          disabled={isGettingLocation}
        >
          {isGettingLocation ? '🔄' : '📍'}
        </button>
        
        {/* Clear button */}
        {query && (
          <button
            type="button"
            onClick={clearSearch}
            className="search-clear"
            title="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {/* Categorized Suggestions (shown when input is empty/focused) */}
      {showCategorizedSuggestions && !query.trim() && (
        <div className="categorized-suggestions">
          {/* Frequent Places */}
          {frequentPlaces.length > 0 && (
            <div className="suggestion-category">
              <div className="category-header">
                <span className="category-icon">⭐</span>
                <span className="category-title">Frequent</span>
              </div>
              {frequentPlaces.map((place, index) => (
                <button
                  key={`frequent-${index}`}
                  type="button"
                  className="search-suggestion categorized"
                  onClick={() => handleSuggestionClick(place)}
                >
                  <span className="suggestion-icon">⭐</span>
                  <span className="suggestion-text">{place.name}</span>
                </button>
              ))}
            </div>
          )}
          
          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div className="suggestion-category">
              <div className="category-header">
                <span className="category-icon">🕒</span>
                <span className="category-title">Recent</span>
              </div>
              {recentSearches.map((place, index) => (
                <button
                  key={`recent-${index}`}
                  type="button"
                  className="search-suggestion categorized"
                  onClick={() => handleSuggestionClick(place)}
                >
                  <span className="suggestion-icon">🕒</span>
                  <span className="suggestion-text">{place.name}</span>
                </button>
              ))}
            </div>
          )}
          
          {/* Saved Places */}
          {savedPlaces.length > 0 && (
            <div className="suggestion-category">
              <div className="category-header">
                <span className="category-icon">💾</span>
                <span className="category-title">Saved</span>
              </div>
              {savedPlaces.map((place, index) => (
                <button
                  key={`saved-${index}`}
                  type="button"
                  className="search-suggestion categorized"
                  onClick={() => handleSuggestionClick(place)}
                >
                  <span className="suggestion-icon">💾</span>
                  <span className="suggestion-text">{place.name}</span>
                </button>
              ))}
            </div>
          )}
          
          {/* Show minimize button */}
          <div className="suggestions-expand">
            <button 
              type="button"
              className="expand-suggestions-btn"
              onClick={() => setShowCategorizedSuggestions(false)}
            >
              ↑ Minimize suggestions
            </button>
          </div>
        </div>
      )}
      
      {/* Regular Search Suggestions (shown when typing) */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="search-suggestions">
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.id}
              type="button"
              className={`search-suggestion ${selectedIndex === index ? 'selected' : ''}`}
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <span className="suggestion-icon">
                {getLocationIcon(suggestion.type)}
              </span>
              <div className="suggestion-content">
                <span className="suggestion-text">
                  {suggestion.display_name}
                </span>
                {detectedCity && detectedCity.city && (
                  <span className="suggestion-context">
                    in {detectedCity.city}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
      
      {/* Show categorized suggestions prompt when minimized */}
      {!showSuggestions && !showCategorizedSuggestions && !query.trim() && (
        <div className="suggestions-prompt">
          <button 
            type="button"
            className="show-suggestions-btn"
            onClick={() => setShowCategorizedSuggestions(true)}
          >
            ↓ Show recent & frequent places
          </button>
        </div>
      )}

      {/* Context indicator */}
      {detectedCity && detectedCity.city && (
        <div className="search-context-indicator">
          <span className="context-icon">📍</span>
          <span className="context-text">Searching in {detectedCity.city}</span>
        </div>
      )}

      {/* No results message */}
      {showSuggestions && !isLoading && query.length >= 3 && suggestions.length === 0 && (
        <div className="search-no-results">
          <span className="no-results-icon">🔍</span>
          <span className="no-results-text">
            No locations found for "{query}"
            {detectedCity && detectedCity.city && ` in ${detectedCity.city}`}
          </span>
        </div>
      )}
    </div>
  );
}

export default LocationSearch;