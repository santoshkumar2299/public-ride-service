import { useState, useEffect, useRef, useCallback } from 'react';
import './BusStopHelper.css';

const BusStopHelper = ({ user, currentLocation, onStartHelping, onStopHelping }) => {
  // Helper session states
  const [isHelping, setIsHelping] = useState(false);
  const [helperId, setHelperId] = useState(null);
  const [busStopName, setBusStopName] = useState('');
  const [waitingForBuses, setWaitingForBuses] = useState([]);
  const [currentBusInput, setCurrentBusInput] = useState('');
  
  // Arrival update states
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [updateBusNumber, setUpdateBusNumber] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState('');
  const [confidenceLevel, setConfidenceLevel] = useState('medium');
  const [updateMethod, setUpdateMethod] = useState('visual_sighting');
  const [additionalInfo, setAdditionalInfo] = useState('');
  
  // Nearby helpers and updates
  const [nearbyHelpers, setNearbyHelpers] = useState([]);
  const [recentUpdates, setRecentUpdates] = useState([]);
  const [humanityScore, setHumanityScore] = useState(null);
  
  // UI states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmStop, setShowConfirmStop] = useState(false);
  
  const intervalRef = useRef(null);

  // Fetch user's humanity score
  useEffect(() => {
    if (user?.id) {
      fetchHumanityScore();
    }
  }, [user?.id]);

  // Poll for nearby helpers and updates when location changes
  useEffect(() => {
    if (currentLocation) {
      fetchNearbyHelpers();
      fetchRecentUpdates();
      
      // Set up polling interval
      intervalRef.current = setInterval(() => {
        fetchNearbyHelpers();
        fetchRecentUpdates();
      }, 30000); // Poll every 30 seconds
      
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [currentLocation]);

  const fetchHumanityScore = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/humanity-credits/score/${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setHumanityScore(data);
      }
    } catch (error) {
      console.error('Error fetching humanity score:', error);
    }
  };

  const fetchNearbyHelpers = async () => {
    if (!currentLocation) return;
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/bus-stop/nearby-helpers?lat=${currentLocation.lat}&lng=${currentLocation.lng}&radius=1`
      );
      if (response.ok) {
        const data = await response.json();
        setNearbyHelpers(data.helpers || []);
      }
    } catch (error) {
      console.error('Error fetching nearby helpers:', error);
    }
  };

  const fetchRecentUpdates = async () => {
    if (!currentLocation) return;
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/bus-stop/arrival-updates?lat=${currentLocation.lat}&lng=${currentLocation.lng}&radius=2`
      );
      if (response.ok) {
        const data = await response.json();
        setRecentUpdates(data.updates || []);
      }
    } catch (error) {
      console.error('Error fetching recent updates:', error);
    }
  };

  const handleStartHelping = async () => {
    if (!busStopName || !currentLocation) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/bus-stop/start-helping`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          bus_stop_name: busStopName,
          bus_stop_lat: currentLocation.lat,
          bus_stop_lng: currentLocation.lng,
          waiting_for_buses: waitingForBuses
        })
      });

      if (response.ok) {
        const data = await response.json();
        setHelperId(data.helper_id);
        setIsHelping(true);
        onStartHelping?.(data.helper_id);
        fetchNearbyHelpers(); // Refresh to show current user as helper
      }
    } catch (error) {
      console.error('Error starting help session:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStopHelping = async () => {
    setIsHelping(false);
    setHelperId(null);
    setShowConfirmStop(false);
    onStopHelping?.();
    fetchNearbyHelpers(); // Refresh to remove current user
  };

  const addBusToWaitingList = () => {
    if (currentBusInput && !waitingForBuses.includes(currentBusInput.toUpperCase())) {
      setWaitingForBuses([...waitingForBuses, currentBusInput.toUpperCase()]);
      setCurrentBusInput('');
    }
  };

  const removeBusFromWaitingList = (busToRemove) => {
    setWaitingForBuses(waitingForBuses.filter(bus => bus !== busToRemove));
  };

  const handlePostUpdate = async () => {
    if (!helperId || !updateBusNumber || !estimatedMinutes) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/bus-stop/arrival-update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          helper_id: helperId,
          bus_number: updateBusNumber.toUpperCase(),
          estimated_arrival_minutes: parseInt(estimatedMinutes),
          confidence_level: confidenceLevel,
          update_method: updateMethod,
          additional_info: additionalInfo
        })
      });

      if (response.ok) {
        // Reset form
        setUpdateBusNumber('');
        setEstimatedMinutes('');
        setConfidenceLevel('medium');
        setUpdateMethod('visual_sighting');
        setAdditionalInfo('');
        setShowUpdateForm(false);
        
        // Refresh updates
        fetchRecentUpdates();
        fetchHumanityScore(); // Update score
      }
    } catch (error) {
      console.error('Error posting arrival update:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcknowledgeHelp = async (update, wasHelpful, rating = 5) => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/humanity-credits/acknowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          arrival_update_id: update.id,
          beneficiary_user_id: user.id,
          helper_user_id: update.user_id,
          acknowledgment_type: 'used_info',
          rating: rating,
          was_helpful: wasHelpful
        })
      });
      
      // Refresh updates to show acknowledgment
      fetchRecentUpdates();
    } catch (error) {
      console.error('Error acknowledging help:', error);
    }
  };

  const formatTimeAgo = (minutesAgo) => {
    if (minutesAgo < 1) return 'Just now';
    if (minutesAgo < 60) return `${Math.floor(minutesAgo)}m ago`;
    const hours = Math.floor(minutesAgo / 60);
    return `${hours}h ago`;
  };

  const getHelperLevelColor = (level) => {
    const colors = {
      bronze: '#CD7F32',
      silver: '#C0C0C0', 
      gold: '#FFD700',
      platinum: '#E5E4E2',
      humanity_hero: '#FF6B6B'
    };
    return colors[level] || colors.bronze;
  };

  const getHelperLevelEmoji = (level) => {
    const emojis = {
      bronze: '🥉',
      silver: '🥈',
      gold: '🥇',
      platinum: '💎',
      humanity_hero: '🦸'
    };
    return emojis[level] || emojis.bronze;
  };

  return (
    <div className="bus-stop-helper">
      {/* Helper Status Header */}
      <div className="helper-status-header">
        {isHelping ? (
          <div className="helping-status active">
            <div className="status-indicator">
              <span className="helper-icon">🎯</span>
              <div className="status-text">
                <span className="status-label">Helping at {busStopName}</span>
                <span className="helper-subtitle">Being a community hero!</span>
              </div>
            </div>
            <button 
              className="stop-helping-btn"
              onClick={() => setShowConfirmStop(true)}
            >
              Stop Helping
            </button>
          </div>
        ) : (
          <div className="helping-status inactive">
            <span className="helper-icon">🚌</span>
            <span className="status-label">Ready to help fellow travelers?</span>
          </div>
        )}
      </div>

      {/* Humanity Score Display */}
      {humanityScore && (
        <div className="humanity-score-card">
          <div className="score-header">
            <span className="score-icon">{getHelperLevelEmoji(humanityScore.helper_level)}</span>
            <div className="score-details">
              <span className="score-title">Humanity Level: {humanityScore.helper_level}</span>
              <span className="score-subtitle">{humanityScore.total_credits} credits • {humanityScore.total_people_helped} people helped</span>
            </div>
            <div className="score-rating">
              <span className="rating-stars">{'⭐'.repeat(Math.floor(humanityScore.average_rating))}</span>
              <span className="rating-number">{humanityScore.average_rating.toFixed(1)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Start Helping Section */}
      {!isHelping && (
        <div className="start-helping-section">
          <div className="section-header">
            <h3>🤝 Start Helping at Bus Stop</h3>
            <p>Share bus arrival info with fellow travelers and earn humanity credits!</p>
          </div>
          
          <div className="input-group">
            <label>Bus Stop Name</label>
            <input
              type="text"
              placeholder="e.g., HITEC City Main Gate, Jubilee Hills Check Post"
              value={busStopName}
              onChange={(e) => setBusStopName(e.target.value)}
              className="stop-name-input"
            />
          </div>

          <div className="input-group">
            <label>Buses You're Waiting For (Optional)</label>
            <div className="bus-input-section">
              <div className="add-bus-input">
                <input
                  type="text"
                  placeholder="Bus number (e.g., 185G)"
                  value={currentBusInput}
                  onChange={(e) => setCurrentBusInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addBusToWaitingList()}
                />
                <button onClick={addBusToWaitingList} disabled={!currentBusInput}>
                  Add
                </button>
              </div>
              
              {waitingForBuses.length > 0 && (
                <div className="waiting-buses-list">
                  {waitingForBuses.map(bus => (
                    <span key={bus} className="waiting-bus-tag">
                      {bus}
                      <button onClick={() => removeBusFromWaitingList(bus)}>×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button 
            className="start-helping-btn"
            onClick={handleStartHelping}
            disabled={!busStopName || isSubmitting}
          >
            {isSubmitting ? '🎯 Starting...' : '🤝 Start Helping Others'}
          </button>
        </div>
      )}

      {/* Post Arrival Update Section */}
      {isHelping && (
        <div className="arrival-update-section">
          <div className="section-header">
            <h3>📢 Post Bus Arrival Update</h3>
            <p>Help fellow travelers by sharing when buses are arriving!</p>
          </div>

          {!showUpdateForm ? (
            <button 
              className="show-update-form-btn"
              onClick={() => setShowUpdateForm(true)}
            >
              📢 Post Bus Arrival Update
            </button>
          ) : (
            <div className="update-form">
              <div className="form-row">
                <div className="input-group">
                  <label>Bus Number</label>
                  <input
                    type="text"
                    placeholder="e.g., 185G"
                    value={updateBusNumber}
                    onChange={(e) => setUpdateBusNumber(e.target.value)}
                  />
                </div>
                
                <div className="input-group">
                  <label>Arriving in (minutes)</label>
                  <input
                    type="number"
                    placeholder="5"
                    min="0"
                    max="60"
                    value={estimatedMinutes}
                    onChange={(e) => setEstimatedMinutes(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="input-group">
                  <label>How sure are you?</label>
                  <select 
                    value={confidenceLevel} 
                    onChange={(e) => setConfidenceLevel(e.target.value)}
                  >
                    <option value="high">💯 Very Sure</option>
                    <option value="medium">😐 Somewhat Sure</option>
                    <option value="low">🤔 Not Very Sure</option>
                  </select>
                </div>
                
                <div className="input-group">
                  <label>Update Method</label>
                  <select 
                    value={updateMethod} 
                    onChange={(e) => setUpdateMethod(e.target.value)}
                  >
                    <option value="visual_sighting">👀 I can see it</option>
                    <option value="schedule_check">📅 Checked schedule</option>
                    <option value="local_knowledge">🧠 Local knowledge</option>
                  </select>
                </div>
              </div>

              <div className="input-group">
                <label>Additional Info (Optional)</label>
                <textarea
                  placeholder="e.g., Bus is quite full, running slightly late due to traffic..."
                  value={additionalInfo}
                  onChange={(e) => setAdditionalInfo(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="form-actions">
                <button 
                  className="cancel-btn"
                  onClick={() => setShowUpdateForm(false)}
                >
                  Cancel
                </button>
                <button 
                  className="post-update-btn"
                  onClick={handlePostUpdate}
                  disabled={!updateBusNumber || !estimatedMinutes || isSubmitting}
                >
                  {isSubmitting ? '📤 Posting...' : '📢 Post Update'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recent Arrival Updates */}
      {recentUpdates.length > 0 && (
        <div className="recent-updates-section">
          <div className="section-header">
            <h3>📋 Recent Bus Updates Nearby</h3>
            <p>Latest arrival predictions from community helpers</p>
          </div>
          
          <div className="updates-list">
            {recentUpdates.slice(0, 10).map(update => (
              <div key={update.id} className="update-card">
                <div className="update-header">
                  <div className="bus-info">
                    <span className="bus-number">🚌 {update.bus_number}</span>
                    <span className="arrival-time">
                      {update.estimated_arrival_minutes === 0 ? 'Arriving now!' : 
                       update.estimated_arrival_minutes === 1 ? '1 minute' :
                       `${update.estimated_arrival_minutes} minutes`}
                    </span>
                  </div>
                  <div className="update-meta">
                    <span className="time-ago">{formatTimeAgo(update.minutes_ago)}</span>
                  </div>
                </div>
                
                <div className="update-details">
                  <div className="helper-info">
                    <span className="helper-level" style={{ color: getHelperLevelColor(update.helper_level) }}>
                      {getHelperLevelEmoji(update.helper_level)}
                    </span>
                    <span className="helper-name">{update.helper_name}</span>
                    <span className="bus-stop">at {update.bus_stop_name}</span>
                    <span className="distance">({update.distance.toFixed(1)}km away)</span>
                  </div>
                  
                  {update.additional_info && (
                    <div className="additional-info">💬 {update.additional_info}</div>
                  )}
                </div>

                <div className="update-actions">
                  <button 
                    className="helpful-btn"
                    onClick={() => handleAcknowledgeHelp(update, true, 5)}
                  >
                    👍 Helpful
                  </button>
                  <button 
                    className="not-helpful-btn"
                    onClick={() => handleAcknowledgeHelp(update, false, 2)}
                  >
                    👎 Not Helpful
                  </button>
                  <span className="beneficiaries">
                    {update.beneficiaries_count > 0 && `${update.beneficiaries_count} people helped`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Nearby Active Helpers */}
      {nearbyHelpers.length > 0 && (
        <div className="nearby-helpers-section">
          <div className="section-header">
            <h3>🎯 Active Helpers Nearby</h3>
            <p>Community members currently helping at bus stops</p>
          </div>
          
          <div className="helpers-list">
            {nearbyHelpers.map(helper => (
              <div key={helper.id} className="helper-card">
                <div className="helper-info">
                  <span className="helper-level" style={{ color: getHelperLevelColor(helper.helper_level) }}>
                    {getHelperLevelEmoji(helper.helper_level)}
                  </span>
                  <div className="helper-details">
                    <span className="helper-name">{helper.helper_name}</span>
                    <span className="helper-location">at {helper.bus_stop_name}</span>
                    <span className="helper-stats">
                      ⭐ {helper.average_rating?.toFixed(1)} • 
                      🤝 {helper.total_people_helped} helped • 
                      📍 {helper.distance.toFixed(1)}km away
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stop Helping Confirmation */}
      {showConfirmStop && (
        <div className="confirmation-overlay">
          <div className="confirmation-dialog">
            <h3>🛑 Stop Helping Session?</h3>
            <p>Are you sure you want to stop helping at {busStopName}?</p>
            <p>You've been a community hero! Others are counting on your updates.</p>
            
            <div className="confirmation-actions">
              <button 
                className="cancel-btn"
                onClick={() => setShowConfirmStop(false)}
              >
                Continue Helping
              </button>
              <button 
                className="confirm-btn"
                onClick={handleStopHelping}
              >
                Stop Helping
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusStopHelper;