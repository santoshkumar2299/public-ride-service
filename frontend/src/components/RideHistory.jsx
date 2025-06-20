import { useState, useEffect } from 'react';
import { config } from '../config/env';

function RideHistory({ user }) {
  const [history, setHistory] = useState({ rides: [], requests: [] });
  const [filter, setFilter] = useState('all'); // 'all', 'rider', 'passenger'
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedItems, setExpandedItems] = useState(new Set());

  useEffect(() => {
    fetchHistory();
  }, [user.id]);

  const fetchHistory = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${config.apiBaseUrl}/api/users/${user.id}/history`);
      const data = await response.json();
      
      if (response.ok) {
        setHistory(data);
      } else {
        setError(data.error || 'Failed to fetch history');
      }
    } catch (error) {
      setError(`Network error: ${error.message}. Please check if the backend server is running.`);
      console.error('History fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: { text: 'Active', class: 'status-active' },
      completed: { text: 'Completed', class: 'status-completed' },
      cancelled: { text: 'Cancelled', class: 'status-cancelled' },
      pending: { text: 'Pending', class: 'status-pending' },
      matched: { text: 'Matched', class: 'status-matched' }
    };
    
    const badge = badges[status] || { text: status, class: 'status-default' };
    return <span className={`status-badge ${badge.class}`}>{badge.text}</span>;
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

  const filteredData = () => {
    switch (filter) {
      case 'rider':
        return { rides: history.rides, requests: [] };
      case 'passenger':
        return { rides: [], requests: history.requests };
      default:
        return history;
    }
  };

  const { rides, requests } = filteredData();
  const totalItems = rides.length + requests.length;

  if (isLoading) {
    return (
      <div className="ride-history">
        <div className="loading-state">
          <h2>📚 Loading your ride history...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="ride-history">
      <div className="history-header">
        <h2>📚 Your Ride History</h2>
        <p className="history-subtitle">View all your past rides and requests</p>
      </div>

      {error && (
        <div className="error-message">
          ⚠️ {error}
          <button onClick={fetchHistory} className="retry-btn">
            🔄 Retry
          </button>
        </div>
      )}

      {/* Filter buttons */}
      <div className="history-filters">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          📋 All ({history.rides.length + history.requests.length})
        </button>
        <button
          className={`filter-btn ${filter === 'rider' ? 'active' : ''}`}
          onClick={() => setFilter('rider')}
        >
          🚗 As Rider ({history.rides.length})
        </button>
        <button
          className={`filter-btn ${filter === 'passenger' ? 'active' : ''}`}
          onClick={() => setFilter('passenger')}
        >
          🚶 As Passenger ({history.requests.length})
        </button>
      </div>

      {totalItems === 0 ? (
        <div className="empty-history">
          <div className="empty-icon">🗂️</div>
          <h3>No {filter === 'all' ? '' : filter} history yet</h3>
          <p>
            {filter === 'all' 
              ? "You haven't created any rides or requests yet." 
              : `You haven't ${filter === 'rider' ? 'offered any rides' : 'made any ride requests'} yet.`
            }
          </p>
        </div>
      ) : (
        <div className="history-content">
          {/* Rides as a rider */}
          {rides.length > 0 && (
            <div className="history-section">
              <h3 className="section-title">🚗 Rides You Offered</h3>
              <div className="modern-rides-container">
                {rides.map(ride => {
                  const isExpanded = expandedItems.has(ride.id);
                  const statusClass = ride.status === 'completed' ? 'completed' : 
                                    ride.status === 'cancelled' ? 'cancelled' : 'active';
                  return (
                    <div key={ride.id} className={`modern-ride-card ${isExpanded ? 'expanded' : ''}`}>
                      <div className="ride-main-row">
                        <div className={`ride-status-indicator ${statusClass}`}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L18 10V6c0-2-2-4-4-4H4c-2 0-4 2-4 4v5h2a3 3 0 0 0 6 0h2a3 3 0 0 0 6 0Z"/>
                            <circle cx="7" cy="17" r="2"/>
                            <path d="M9 17h6"/>
                            <circle cx="17" cy="17" r="2"/>
                          </svg>
                        </div>

                        <div className="ride-main-content">
                          <div className="ride-primary-info">
                            <h3 className="ride-title-text">Ride Offered</h3>
                            <span className="ride-status-text">{ride.status === 'completed' ? 'Completed' : 
                             ride.status === 'cancelled' ? 'Cancelled' : 'Active'}</span>
                          </div>
                          <div className="ride-secondary-info">
                            <span className="ride-route-text">
                              {ride.current_address || 'Starting location'} → {ride.destination || 'Destination'}
                            </span>
                          </div>
                        </div>

                        <div className="ride-meta-sidebar">
                          <span className="ride-time-text">{formatDate(ride.created_at).split(',')[0]}</span>
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
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="expanded-details">
                          <div className="detail-section">
                            <h4>Ride Details</h4>
                            <div className="detail-grid">
                              <div className="detail-item">
                                <span className="label">From Coordinates</span>
                                <span className="value">{ride.current_lat?.toFixed(4)}, {ride.current_lng?.toFixed(4)}</span>
                              </div>
                              <div className="detail-item">
                                <span className="label">To Coordinates</span>
                                <span className="value">{ride.destination_lat?.toFixed(4)}, {ride.destination_lng?.toFixed(4)}</span>
                              </div>
                              <div className="detail-item">
                                <span className="label">Date & Time</span>
                                <span className="value">{formatDate(ride.created_at)}</span>
                              </div>
                              <div className="detail-item">
                                <span className="label">Ride ID</span>
                                <span className="value">{ride.id}</span>
                              </div>
                              <div className="detail-item">
                                <span className="label">Final Status</span>
                                <span className="value">{getStatusBadge(ride.status)}</span>
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

          {/* Requests as a passenger */}
          {requests.length > 0 && (
            <div className="history-section">
              <h3 className="section-title">🚶 Ride Requests You Made</h3>
              <div className="modern-rides-container">
                {requests.map(request => {
                  const isExpanded = expandedItems.has(request.id);
                  const statusClass = request.status === 'completed' ? 'completed' : 
                                    request.status === 'cancelled' ? 'cancelled' : 'pending';
                  return (
                    <div key={request.id} className={`modern-ride-card ${isExpanded ? 'expanded' : ''}`}>
                      <div className="ride-main-row">
                        <div className={`ride-status-indicator ${statusClass}`}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                            <circle cx="12" cy="7" r="4"/>
                          </svg>
                        </div>

                        <div className="ride-main-content">
                          <div className="ride-primary-info">
                            <h3 className="ride-title-text">Ride Request</h3>
                            <span className="ride-status-text">{request.status === 'completed' ? 'Completed' : 
                             request.status === 'cancelled' ? 'Cancelled' : 
                             request.status === 'matched' ? 'Matched' : 'Pending'}</span>
                          </div>
                          <div className="ride-secondary-info">
                            <span className="ride-route-text">
                              {request.pickup_address || 'Pickup location'} → {request.destination_address || 'Destination'}
                            </span>
                          </div>
                        </div>

                        <div className="ride-meta-sidebar">
                          <span className="ride-time-text">{formatDate(request.created_at).split(',')[0]}</span>
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
                                <span className="label">Date & Time</span>
                                <span className="value">{formatDate(request.created_at)}</span>
                              </div>
                              <div className="detail-item">
                                <span className="label">Request ID</span>
                                <span className="value">{request.id}</span>
                              </div>
                              <div className="detail-item">
                                <span className="label">Final Status</span>
                                <span className="value">{getStatusBadge(request.status)}</span>
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
      )}
    </div>
  );
}

export default RideHistory;