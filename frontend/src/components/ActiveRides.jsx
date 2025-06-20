import { useState, useEffect } from 'react';
import { config } from '../config/env';

function ActiveRides({ user }) {
  const [activeRides, setActiveRides] = useState([]);
  const [activeRequests, setActiveRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedItems, setExpandedItems] = useState(new Set());

  useEffect(() => {
    fetchActiveData();
    
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchActiveData, 30000);
    return () => clearInterval(interval);
  }, [user.id]);

  const fetchActiveData = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${config.apiBaseUrl}/api/users/${user.id}/history`);
      const data = await response.json();
      
      if (response.ok) {
        // Filter for active items only
        const activeRides = data.rides.filter(ride => ride.status === 'active');
        const activeRequests = data.requests.filter(request => request.status === 'pending');
        
        setActiveRides(activeRides);
        setActiveRequests(activeRequests);
      } else {
        setError(data.error || 'Failed to fetch active rides');
      }
    } catch (error) {
      setError(`Network error: ${error.message}. Please check if the backend server is running.`);
      console.error('Active rides fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getTimeSince = (dateString) => {
    const now = new Date();
    const created = new Date(dateString);
    const diffMs = now - created;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMins}m ago`;
    }
    return `${diffMins}m ago`;
  };

  const cancelRide = async (rideId) => {
    if (!confirm('Are you sure you want to cancel this ride?')) return;
    
    try {
      const response = await fetch(`${config.apiBaseUrl}/api/rides/${rideId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' })
      });
      
      if (response.ok) {
        fetchActiveData(); // Refresh the list
      } else {
        alert('Failed to cancel ride');
      }
    } catch (error) {
      alert('Error cancelling ride');
    }
  };

  const cancelRequest = async (requestId) => {
    if (!confirm('Are you sure you want to cancel this request?')) return;
    
    try {
      const response = await fetch(`${config.apiBaseUrl}/api/requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' })
      });
      
      if (response.ok) {
        fetchActiveData(); // Refresh the list
      } else {
        alert('Failed to cancel request');
      }
    } catch (error) {
      alert('Error cancelling request');
    }
  };

  const toggleExpanded = (itemId) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  if (isLoading) {
    return (
      <div className="active-rides">
        <div className="loading-state">
          <h2>🚗 Loading active rides...</h2>
        </div>
      </div>
    );
  }

  const totalActive = activeRides.length + activeRequests.length;

  return (
    <div className="active-rides">
      <div className="active-header">
        <h2>🚗 Active Rides & Requests</h2>
        <p className="active-subtitle">
          Manage your current rides and requests
          <button onClick={fetchActiveData} className="refresh-btn" title="Refresh">
            🔄
          </button>
        </p>
      </div>

      {error && (
        <div className="error-message">
          ⚠️ {error}
          <button onClick={fetchActiveData} className="retry-btn">
            🔄 Retry
          </button>
        </div>
      )}

      {totalActive === 0 ? (
        <div className="empty-active">
          <div className="empty-icon">🏁</div>
          <h3>No active rides or requests</h3>
          <p>You don't have any active rides or pending requests at the moment.</p>
        </div>
      ) : (
        <div className="active-content">
          <div className="active-header-combined">
            <h3 className="section-title">
              🚗 Active Rides & Requests 
              <span className="total-count">({totalActive})</span>
            </h3>
            <div className="type-breakdown">
              {activeRides.length > 0 && (
                <span className="type-chip rides">🚗 {activeRides.length} Rides</span>
              )}
              {activeRequests.length > 0 && (
                <span className="type-chip requests">🚶 {activeRequests.length} Requests</span>
              )}
            </div>
          </div>
          
          {/* Combined rides and requests in one optimized grid */}
          <div className="modern-rides-container">
            {/* Active Rides */}
            {activeRides.map((ride, index) => {
                  const isExpanded = expandedItems.has(ride.id);
                  return (
                    <div key={ride.id} className={`modern-ride-card ${isExpanded ? 'expanded' : ''}`}>
                      <div className="ride-main-row">
                        <div className="ride-status-indicator active">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L18 10V6c0-2-2-4-4-4H4c-2 0-4 2-4 4v5h2a3 3 0 0 0 6 0h2a3 3 0 0 0 6 0Z"/>
                            <circle cx="7" cy="17" r="2"/>
                            <path d="M9 17h6"/>
                            <circle cx="17" cy="17" r="2"/>
                          </svg>
                        </div>

                        <div className="ride-main-content">
                          <div className="ride-primary-info">
                            <h3 className="ride-title-text">Active Ride</h3>
                            <span className="ride-status-text">Live</span>
                          </div>
                          <div className="ride-secondary-info">
                            <span className="ride-route-text">
                              {ride.current_address || 'Your location'} → {ride.destination || 'Destination'}
                            </span>
                          </div>
                        </div>

                        <div className="ride-meta-sidebar">
                          <span className="ride-time-text">{getTimeSince(ride.created_at)}</span>
                          <span className="ride-id-text">#{ride.id.substring(0, 6)}</span>
                        </div>

                        <div className="ride-actions-list">
                          <button 
                            className="expand-btn"
                            onClick={() => toggleExpanded(ride.id)}
                            title={isExpanded ? 'Collapse details' : 'Expand details'}
                          >
                            {isExpanded ? '▲' : '▼'}
                          </button>
                          <button 
                            className="list-action-btn danger"
                            onClick={(e) => {
                              e.stopPropagation();
                              cancelRide(ride.id);
                            }}
                          >
                            End
                          </button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="expanded-details">
                          <div className="detail-section">
                            <h4>Location Details</h4>
                            <div className="detail-grid">
                              <div className="detail-item">
                                <span className="label">Current Coordinates</span>
                                <span className="value">{ride.current_lat?.toFixed(4)}, {ride.current_lng?.toFixed(4)}</span>
                              </div>
                              <div className="detail-item">
                                <span className="label">Destination Coordinates</span>
                                <span className="value">{ride.destination_lat?.toFixed(4)}, {ride.destination_lng?.toFixed(4)}</span>
                              </div>
                              <div className="detail-item">
                                <span className="label">Started</span>
                                <span className="value">{formatDate(ride.created_at)}</span>
                              </div>
                              <div className="detail-item">
                                <span className="label">Ride ID</span>
                                <span className="value">{ride.id}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
            })}
            
            {/* Active Requests */}
            {activeRequests.map((request, index) => {
                  const isExpanded = expandedItems.has(request.id);
                  return (
                    <div key={request.id} className={`modern-ride-card ${isExpanded ? 'expanded' : ''}`}>
                      <div className="ride-main-row">
                        <div className="ride-status-indicator pending">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                            <circle cx="12" cy="7" r="4"/>
                          </svg>
                        </div>

                        <div className="ride-main-content">
                          <div className="ride-primary-info">
                            <h3 className="ride-title-text">Ride Request</h3>
                            <span className="ride-status-text searching">Searching</span>
                          </div>
                          <div className="ride-secondary-info">
                            <span className="ride-route-text">
                              {request.pickup_address || 'Pickup location'} → {request.destination_address || 'Destination'}
                            </span>
                          </div>
                        </div>

                        <div className="ride-meta-sidebar">
                          <span className="ride-time-text">{getTimeSince(request.created_at)}</span>
                          <span className="ride-id-text">#{request.id.substring(0, 6)}</span>
                        </div>

                        <div className="ride-actions-list">
                          <button 
                            className="expand-btn"
                            onClick={() => toggleExpanded(request.id)}
                            title={isExpanded ? 'Collapse details' : 'Expand details'}
                          >
                            {isExpanded ? '▲' : '▼'}
                          </button>
                          <button 
                            className="list-action-btn danger"
                            onClick={(e) => {
                              e.stopPropagation();
                              cancelRequest(request.id);
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="expanded-details">
                          <div className="detail-section">
                            <h4>Request Details</h4>
                            <div className="detail-grid">
                              <div className="detail-item">
                                <span className="label">Pickup Coordinates</span>
                                <span className="value">{request.pickup_lat?.toFixed(4)}, {request.pickup_lng?.toFixed(4)}</span>
                              </div>
                              <div className="detail-item">
                                <span className="label">Destination Coordinates</span>
                                <span className="value">{request.destination_lat?.toFixed(4)}, {request.destination_lng?.toFixed(4)}</span>
                              </div>
                              <div className="detail-item">
                                <span className="label">Maximum Walk Distance</span>
                                <span className="value">{request.max_walk_distance} meters</span>
                              </div>
                              <div className="detail-item">
                                <span className="label">Requested</span>
                                <span className="value">{formatDate(request.created_at)}</span>
                              </div>
                              <div className="detail-item">
                                <span className="label">Request ID</span>
                                <span className="value">{request.id}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default ActiveRides;