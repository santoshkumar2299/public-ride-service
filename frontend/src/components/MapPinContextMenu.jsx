import { useState, useEffect, useRef } from 'react';
import './MapPinContextMenu.css';

function MapPinContextMenu({ 
  position, 
  coordinates, 
  isVisible, 
  onClose, 
  onGoHere, 
  onStartFromHere, 
  onHowToGo,
  onAddToFavorites,
  onEditLocation
}) {
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isVisible, onClose]);

  // Close menu on ESC key
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape' && isVisible) {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener('keydown', handleEscKey);
      return () => document.removeEventListener('keydown', handleEscKey);
    }
  }, [isVisible, onClose]);

  if (!isVisible || !position || !coordinates) return null;

  const handleAction = (action, actionFn) => {
    console.log(`Map pin action: ${action}`, coordinates);
    if (actionFn) {
      actionFn(coordinates);
    }
    onClose();
  };

  // Format coordinates for display
  const formatCoordinate = (coord) => coord.toFixed(4);

  return (
    <div 
      className="map-pin-context-menu"
      ref={menuRef}
      style={{
        position: 'fixed',
        top: position.y,
        left: position.x,
        zIndex: 10000,
        pointerEvents: 'auto'
      }}
    >
      <div className="pin-menu-header">
        <div className="pin-location-info">
          <span className="pin-icon">📍</span>
          <div className="pin-coordinates">
            {formatCoordinate(coordinates.lat)}, {formatCoordinate(coordinates.lng)}
          </div>
        </div>
        <button 
          className="pin-close-btn"
          onClick={onClose}
          aria-label="Close menu"
        >
          ×
        </button>
      </div>

      <div className="pin-menu-actions">
        <button 
          className="pin-action-btn edit-location primary"
          onClick={() => handleAction('edit-location', onEditLocation)}
        >
          <span className="action-icon">🔍</span>
          <span className="action-text">Search & Travel</span>
          <span className="action-description">Quick location search</span>
        </button>

        <button 
          className="pin-action-btn go-here"
          onClick={() => handleAction('go-here', onGoHere)}
        >
          <span className="action-icon">🎯</span>
          <span className="action-text">Go to this place</span>
          <span className="action-description">Set as destination</span>
        </button>

        <button 
          className="pin-action-btn start-from-here"
          onClick={() => handleAction('start-from-here', onStartFromHere)}
        >
          <span className="action-icon">🚀</span>
          <span className="action-text">Start from here</span>
          <span className="action-description">Set as origin point</span>
        </button>

        <button 
          className="pin-action-btn how-to-go"
          onClick={() => handleAction('how-to-go', onHowToGo)}
        >
          <span className="action-icon">🗺️</span>
          <span className="action-text">How to go</span>
          <span className="action-description">Find transport options</span>
        </button>

        <button 
          className="pin-action-btn add-favorite"
          onClick={() => handleAction('add-favorite', onAddToFavorites)}
        >
          <span className="action-icon">⭐</span>
          <span className="action-text">Add to favorites</span>
          <span className="action-description">Save this location</span>
        </button>
      </div>

      <div className="pin-menu-footer">
        <div className="quick-actions">
          <button className="quick-action-btn">
            <span>🚌</span>
            <span>Bus stops</span>
          </button>
          <button className="quick-action-btn">
            <span>🚗</span>
            <span>Parking</span>
          </button>
          <button className="quick-action-btn">
            <span>☕</span>
            <span>Nearby</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default MapPinContextMenu;