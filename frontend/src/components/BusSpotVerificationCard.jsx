import { useState } from 'react';
import './BusSpotVerificationCard.css';

/**
 * Card showing bus spots from other users that can be verified
 * Appears on map when user is near a recently reported bus spot
 */
function BusSpotVerificationCard({ busSpot, onVerify, onClose, userLocation }) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationRating, setVerificationRating] = useState(null);

  const handleVerify = async (isAccurate) => {
    setIsVerifying(true);
    try {
      const response = await fetch(`/api/reports/bus-spots/${busSpot.id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verifier_user_id: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).id : 'anonymous',
          is_accurate: isAccurate,
          accuracy_rating: verificationRating || (isAccurate ? 5 : 1),
          verifier_location: userLocation
        })
      });

      if (response.ok) {
        onVerify?.(busSpot.id, isAccurate);
        onClose?.();
      }
    } catch (error) {
      console.error('Verification failed:', error);
    } finally {
      setIsVerifying(false);
    }
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const reported = new Date(timestamp);
    const diffMinutes = Math.floor((now - reported) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return `${Math.floor(diffMinutes / 1440)}d ago`;
  };

  const getConfidenceColor = (confidence) => {
    const colors = {
      high: '#4CAF50',
      medium: '#FF9800', 
      low: '#F44336'
    };
    return colors[confidence] || colors.medium;
  };

  return (
    <div className="bus-spot-verification-card">
      <div className="verification-header">
        <div className="spot-info">
          <div className="bus-number">🚌 Bus {busSpot.bus_number}</div>
          <div className="reporter-info">
            <span className="reporter">Spotted by {busSpot.reporter_name || 'Anonymous'}</span>
            <span className="timestamp">{getTimeAgo(busSpot.reported_at)}</span>
          </div>
        </div>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>

      <div className="verification-content">
        <div className="spot-details">
          <div className="confidence-badge" style={{ backgroundColor: getConfidenceColor(busSpot.confidence_level) }}>
            {busSpot.confidence_level} confidence
          </div>
          {busSpot.photo_path && (
            <div className="photo-indicator">📸 Photo attached</div>
          )}
        </div>

        {busSpot.additional_info && (
          <div className="additional-info">
            <strong>Details:</strong> {busSpot.additional_info}
          </div>
        )}

        <div className="verification-question">
          <h4>Can you confirm this bus is here?</h4>
          <p>Help the community by verifying this spot report</p>
        </div>

        <div className="verification-actions">
          <button 
            className="verify-btn accurate"
            onClick={() => handleVerify(true)}
            disabled={isVerifying}
          >
            ✅ Yes, bus is here
          </button>
          <button 
            className="verify-btn inaccurate"
            onClick={() => handleVerify(false)}
            disabled={isVerifying}
          >
            ❌ No bus here
          </button>
        </div>

        <div className="verification-rewards">
          <div className="reward-info">
            <span className="reward-icon">⭐</span>
            <span className="reward-text">+2 community credits for verification</span>
          </div>
        </div>
      </div>

      {isVerifying && (
        <div className="verification-loading">
          <span className="loading-spinner"></span>
          Recording verification...
        </div>
      )}
    </div>
  );
}

export default BusSpotVerificationCard;