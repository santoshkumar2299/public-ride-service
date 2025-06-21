import { useState, useRef, useCallback } from 'react';
import MapView from './MapView';
import MapPinContextMenu from './MapPinContextMenu';

function MapWithPinning({ 
  center, 
  zoom, 
  markers = [], 
  routes = [], 
  bounds,
  height = '400px',
  showControls = true,
  onZoomChange,
  onGoToLocation,
  onStartFromLocation,
  onFindRouteToLocation,
  onAddToFavorites,
  onMapMove
}) {
  const [pinnedLocation, setPinnedLocation] = useState(null);
  const [contextMenuVisible, setContextMenuVisible] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const mapContainerRef = useRef(null);

  // Handle map click to place pin and show context menu
  const handleMapClick = useCallback((event) => {
    const { lngLat } = event;
    
    // Get click position relative to viewport for context menu positioning
    const clickX = event.originalEvent?.clientX || 0;
    const clickY = event.originalEvent?.clientY || 0;
    
    // Adjust menu position to prevent it from going off-screen
    const menuWidth = 320;
    const menuHeight = 300;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let menuX = clickX + 10; // 10px offset from cursor
    let menuY = clickY + 10;
    
    // Adjust if menu would go off right edge
    if (menuX + menuWidth > viewportWidth) {
      menuX = clickX - menuWidth - 10;
    }
    
    // Adjust if menu would go off bottom edge
    if (menuY + menuHeight > viewportHeight) {
      menuY = clickY - menuHeight - 10;
    }
    
    // Ensure menu doesn't go off left or top edges
    menuX = Math.max(10, menuX);
    menuY = Math.max(10, menuY);
    
    // Set pinned location and show context menu
    setPinnedLocation({
      lat: lngLat.lat,
      lng: lngLat.lng,
      timestamp: Date.now()
    });
    
    setContextMenuPosition({ x: menuX, y: menuY });
    setContextMenuVisible(true);
    
    console.log('Map clicked at:', lngLat);
  }, []);

  // Close context menu
  const handleCloseContextMenu = useCallback(() => {
    setContextMenuVisible(false);
  }, []);

  // Handle "Go to this place" action
  const handleGoHere = useCallback((coordinates) => {
    console.log('Go to this place:', coordinates);
    if (onGoToLocation) {
      onGoToLocation(coordinates);
    }
    // You could also trigger the emergency transport modal here
    // or integrate with existing navigation flows
  }, [onGoToLocation]);

  // Handle "Start from here" action
  const handleStartFromHere = useCallback((coordinates) => {
    console.log('Start from here:', coordinates);
    if (onStartFromLocation) {
      onStartFromLocation(coordinates);
    }
  }, [onStartFromLocation]);

  // Handle "How to go" action
  const handleHowToGo = useCallback((coordinates) => {
    console.log('How to go to:', coordinates);
    if (onFindRouteToLocation) {
      onFindRouteToLocation(coordinates);
    }
    // This could open a modal showing transport options to the location
  }, [onFindRouteToLocation]);

  // Handle "Add to favorites" action
  const handleAddToFavorites = useCallback((coordinates) => {
    console.log('Add to favorites:', coordinates);
    if (onAddToFavorites) {
      onAddToFavorites(coordinates);
    }
  }, [onAddToFavorites]);

  // Create enhanced markers including the pinned location
  const enhancedMarkers = [...markers];
  
  if (pinnedLocation) {
    enhancedMarkers.push({
      latitude: pinnedLocation.lat,
      longitude: pinnedLocation.lng,
      title: 'Pinned Location',
      icon: '📍',
      color: '#ff4444',
      description: 'Click for options'
    });
  }

  return (
    <div ref={mapContainerRef} style={{ position: 'relative', height }}>
      <MapView
        center={center}
        zoom={zoom}
        markers={enhancedMarkers}
        routes={routes}
        bounds={bounds}
        height={height}
        showControls={showControls}
        onMapClick={handleMapClick}
        onZoomChange={onZoomChange}
        onMapMove={onMapMove}
      />
      
      <MapPinContextMenu
        position={contextMenuPosition}
        coordinates={pinnedLocation}
        isVisible={contextMenuVisible}
        onClose={handleCloseContextMenu}
        onGoHere={handleGoHere}
        onStartFromHere={handleStartFromHere}
        onHowToGo={handleHowToGo}
        onAddToFavorites={handleAddToFavorites}
      />
    </div>
  );
}

export default MapWithPinning;