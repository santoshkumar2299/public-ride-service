import { useState, useEffect } from 'react';
import { config } from '../config/env';
import SavedPlaces from './SavedPlaces';

function Profile({ user, onLogout }) {
  const [stats, setStats] = useState({
    totalRides: 0,
    totalRequests: 0,
    activeRides: 0,
    pendingRequests: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUserStats();
  }, [user.id]);

  const fetchUserStats = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch(`${config.apiBaseUrl}/api/users/${user.id}/history`);
      const data = await response.json();
      
      if (response.ok) {
        const totalRides = data.rides.length;
        const totalRequests = data.requests.length;
        const activeRides = data.rides.filter(ride => ride.status === 'active').length;
        const pendingRequests = data.requests.filter(req => req.status === 'pending').length;
        
        setStats({
          totalRides,
          totalRequests,
          activeRides,
          pendingRequests
        });
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatJoinDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      onLogout();
    }
  };

  return (
    <div className="profile-modern">
      {/* Profile Header Card */}
      <div className="profile-card">
        <div className="profile-header-modern">
          <div className="avatar-modern">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <div className="profile-details">
            <h1 className="profile-name">{user.username}</h1>
            <p className="profile-email">{user.email}</p>
            <p className="profile-member-since">
              Member since {formatJoinDate(user.created_at || new Date())}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="stats-row">
        {isLoading ? (
          <div className="stats-loading-modern">Loading...</div>
        ) : (
          <>
            <div className="stat-item">
              <span className="stat-number">{stats.totalRides}</span>
              <span className="stat-label">Rides Offered</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-number">{stats.totalRequests}</span>
              <span className="stat-label">Ride Requests</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-number">{stats.activeRides + stats.pendingRequests}</span>
              <span className="stat-label">Active</span>
            </div>
          </>
        )}
      </div>

      {/* Content Sections */}
      <div className="profile-sections">
        {/* Saved Places - Compact Version */}
        <div className="section-card">
          <SavedPlaces user={user} />
        </div>
      </div>
    </div>
  );
}

export default Profile;