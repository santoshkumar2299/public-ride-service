import { useState, useEffect } from 'react';
import LiveCityMap from './LiveCityMap';
import EmergencyTransportPanel from './panels/EmergencyTransportPanel';
import ShareRidePanel from './panels/ShareRidePanel';
import SpotTransportPanel from './panels/SpotTransportPanel';
import ExploreOptionsPanel from './panels/ExploreOptionsPanel';
import CommunityHelpPanel from './panels/CommunityHelpPanel';

function SystemView({ user, activeScenario, onScenarioSelect, onScenarioComplete }) {
  const [panelWidth, setPanelWidth] = useState(400); // Adjustable panel width
  const [isResizing, setIsResizing] = useState(false);
  const [userLocation, setUserLocation] = useState(null);

  // Detect screen size for responsive behavior
  const [screenSize, setScreenSize] = useState('desktop');
  
  useEffect(() => {
    const updateScreenSize = () => {
      if (window.innerWidth < 768) {
        setScreenSize('mobile');
      } else if (window.innerWidth < 1024) {
        setScreenSize('tablet');
      } else {
        setScreenSize('desktop');
      }
    };

    updateScreenSize();
    window.addEventListener('resize', updateScreenSize);
    return () => window.removeEventListener('resize', updateScreenSize);
  }, []);

  // Auto-detect user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => console.log('Location detection failed:', error),
        { timeout: 5000, enableHighAccuracy: false }
      );
    }
  }, []);

  // Handle panel resizing (desktop only)
  const handleMouseDown = (e) => {
    if (screenSize === 'desktop') {
      setIsResizing(true);
      e.preventDefault();
    }
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isResizing && screenSize === 'desktop') {
        const newWidth = window.innerWidth - e.clientX;
        setPanelWidth(Math.max(300, Math.min(600, newWidth)));
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, screenSize]);

  // Render appropriate panel based on scenario
  const renderPanel = () => {
    if (!activeScenario) return null;

    const panelProps = {
      userLocation,
      onClose: onScenarioComplete,
      screenSize
    };

    switch (activeScenario) {
      case 'emergency_transport':
        return <EmergencyTransportPanel {...panelProps} />;
      case 'share_ride':
        return <ShareRidePanel {...panelProps} />;
      case 'spot_transport':
        return <SpotTransportPanel {...panelProps} />;
      case 'explore_options':
        return <ExploreOptionsPanel {...panelProps} />;
      case 'community_help':
        return <CommunityHelpPanel {...panelProps} />;
      default:
        return null;
    }
  };

  // Mobile: Use full overlay modals (existing behavior)
  if (screenSize === 'mobile') {
    return (
      <LiveCityMap
        user={user}
        activeScenario={activeScenario}
        onScenarioSelect={onScenarioSelect}
        onScenarioComplete={onScenarioComplete}
        userLocation={userLocation}
      />
    );
  }

  // Desktop/Tablet: Split-screen layout
  return (
    <div className="system-view">
      {/* Main Map Area */}
      <div 
        className="map-area"
        style={{ 
          width: activeScenario ? `calc(100% - ${panelWidth}px)` : '100%',
          transition: 'width 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}
      >
        <LiveCityMap
          user={user}
          activeScenario={null} // No modals in system view
          onScenarioSelect={onScenarioSelect}
          onScenarioComplete={onScenarioComplete}
          userLocation={userLocation}
          isSystemView={true}
        />
      </div>

      {/* Resizable Panel Area */}
      {activeScenario && (
        <>
          {/* Resize Handle (Desktop only) */}
          {screenSize === 'desktop' && (
            <div 
              className="resize-handle"
              onMouseDown={handleMouseDown}
              style={{ cursor: isResizing ? 'ew-resize' : 'col-resize' }}
            />
          )}

          {/* Action Panel */}
          <div 
            className="action-panel"
            style={{ 
              width: `${panelWidth}px`,
              transition: isResizing ? 'none' : 'width 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
          >
            {renderPanel()}
          </div>
        </>
      )}
    </div>
  );
}

export default SystemView;