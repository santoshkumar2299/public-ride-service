import { useState, useEffect } from 'react';
import { config } from '../config/env';

function UserPreferences({ user, isOpen, onClose }) {
  const [preferences, setPreferences] = useState({
    transportModes: {
      bus: true,
      train: true,
      metro: true,
      autoRickshaw: true,
      walking: true,
      cycling: false
    },
    accessibility: {
      wheelchairAccess: false,
      lowFloor: false,
      audioAnnouncements: false
    },
    notifications: {
      arrivalAlerts: true,
      crowdingUpdates: true,
      routeChanges: true
    },
    privacy: {
      shareLocation: true,
      publicProfile: false,
      showInLeaderboard: true
    }
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Load user preferences on mount
  useEffect(() => {
    if (user?.id) {
      loadUserPreferences();
    }
  }, [user?.id]);

  // ESC key support
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
      return () => document.removeEventListener('keydown', handleEscKey);
    }
  }, [isOpen, onClose]);

  const loadUserPreferences = async () => {
    try {
      const response = await fetch(`${config.apiBaseUrl}/api/users/${user.id}/preferences`);
      if (response.ok) {
        const data = await response.json();
        if (data.preferences) {
          setPreferences({ ...preferences, ...data.preferences });
        }
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const savePreferences = async () => {
    setIsLoading(true);
    setSaveMessage('');

    try {
      const response = await fetch(`${config.apiBaseUrl}/api/users/${user.id}/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ preferences })
      });

      if (response.ok) {
        setSaveMessage('✅ Preferences saved successfully!');
        setTimeout(() => setSaveMessage(''), 3000);
      } else {
        setSaveMessage('❌ Failed to save preferences');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      setSaveMessage('❌ Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTransportModeChange = (mode) => {
    setPreferences(prev => ({
      ...prev,
      transportModes: {
        ...prev.transportModes,
        [mode]: !prev.transportModes[mode]
      }
    }));
  };

  const handleAccessibilityChange = (feature) => {
    setPreferences(prev => ({
      ...prev,
      accessibility: {
        ...prev.accessibility,
        [feature]: !prev.accessibility[feature]
      }
    }));
  };

  const handleNotificationChange = (type) => {
    setPreferences(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [type]: !prev.notifications[type]
      }
    }));
  };

  const handlePrivacyChange = (setting) => {
    setPreferences(prev => ({
      ...prev,
      privacy: {
        ...prev.privacy,
        [setting]: !prev.privacy[setting]
      }
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="preferences-modal-overlay">
      <div className="preferences-modal user-preferences">
        <div className="preferences-header">
          <div className="header-icon">⚙️</div>
          <h2>User Preferences</h2>
          <p>Customize your transport and app experience</p>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="preferences-content">
          {/* Transport Modes */}
          <div className="preference-section">
            <h3>🚌 Transport Modes</h3>
            <p>Select your preferred modes of transport</p>
            <div className="preference-grid">
              {Object.entries(preferences.transportModes).map(([mode, enabled]) => (
                <div key={mode} className="preference-item">
                  <label className="preference-label">
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={() => handleTransportModeChange(mode)}
                    />
                    <span className="checkmark"></span>
                    <span className="transport-name">
                      {mode === 'autoRickshaw' ? 'Auto-Rickshaw' : 
                       mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </span>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Accessibility */}
          <div className="preference-section">
            <h3>♿ Accessibility</h3>
            <p>Features to support your accessibility needs</p>
            <div className="preference-grid">
              {Object.entries(preferences.accessibility).map(([feature, enabled]) => (
                <div key={feature} className="preference-item">
                  <label className="preference-label">
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={() => handleAccessibilityChange(feature)}
                    />
                    <span className="checkmark"></span>
                    <span className="feature-name">
                      {feature === 'wheelchairAccess' ? 'Wheelchair Access' :
                       feature === 'lowFloor' ? 'Low Floor Vehicles' :
                       feature === 'audioAnnouncements' ? 'Audio Announcements' :
                       feature}
                    </span>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Notifications */}
          <div className="preference-section">
            <h3>🔔 Notifications</h3>
            <p>Choose what updates you want to receive</p>
            <div className="preference-grid">
              {Object.entries(preferences.notifications).map(([type, enabled]) => (
                <div key={type} className="preference-item">
                  <label className="preference-label">
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={() => handleNotificationChange(type)}
                    />
                    <span className="checkmark"></span>
                    <span className="notification-type">
                      {type === 'arrivalAlerts' ? 'Arrival Alerts' :
                       type === 'crowdingUpdates' ? 'Crowding Updates' :
                       type === 'routeChanges' ? 'Route Changes' :
                       type}
                    </span>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Privacy */}
          <div className="preference-section">
            <h3>🔒 Privacy</h3>
            <p>Control your privacy and data sharing</p>
            <div className="preference-grid">
              {Object.entries(preferences.privacy).map(([setting, enabled]) => (
                <div key={setting} className="preference-item">
                  <label className="preference-label">
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={() => handlePrivacyChange(setting)}
                    />
                    <span className="checkmark"></span>
                    <span className="privacy-setting">
                      {setting === 'shareLocation' ? 'Share Location' :
                       setting === 'publicProfile' ? 'Public Profile' :
                       setting === 'showInLeaderboard' ? 'Show in Leaderboard' :
                       setting}
                    </span>
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="preferences-actions">
          <button 
            className="save-preferences-btn"
            onClick={savePreferences}
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save Preferences'}
          </button>
          
          {saveMessage && (
            <div className="save-message">{saveMessage}</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserPreferences;