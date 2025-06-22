import { useState, useEffect } from 'react';
import { config } from '../config/env';
import SavedPlaces from './SavedPlaces';
import UserPreferences from './UserPreferences';
import UserContributionHistory from './UserContributionHistory';
import './UserPreferences.css';
import './ProfileActions.css';

function Profile({ user, onLogout }) {
  const [stats, setStats] = useState({
    totalRides: 0,
    totalRequests: 0,
    activeRides: 0,
    pendingRequests: 0
  });
  const [contributionStats, setContributionStats] = useState({
    busSpots: 0,
    verifications: 0,
    helpSessions: 0,
    totalPoints: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showPreferences, setShowPreferences] = useState(false);
  const [showContributions, setShowContributions] = useState(false);

  useEffect(() => {
    fetchUserStats();
    fetchContributionStats();
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

  const fetchContributionStats = async () => {
    console.log('🔍 Fetching contribution stats for user:', user.id);
    try {
      // Fetch social score and stats
      const socialResponse = await fetch(`/api/social/profile/${user.id}`);
      const spotResponse = await fetch(`/api/users/${user.id}/history?type=spot_reports&timeRange=all`);
      const verifyResponse = await fetch(`/api/users/${user.id}/history?type=verifications&timeRange=all`);
      const helpResponse = await fetch(`/api/users/${user.id}/history?type=help_sessions&timeRange=all`);
      
      console.log('📊 API Response status:', { 
        social: socialResponse.status, 
        spots: spotResponse.status,
        verify: verifyResponse.status,
        help: helpResponse.status
      });

      const socialData = socialResponse.ok ? await socialResponse.json() : { profile: { total_points: 0 } };
      const spotData = spotResponse.ok ? await spotResponse.json() : { reports: [] };
      const verifyData = verifyResponse.ok ? await verifyResponse.json() : { verifications: [] };
      const helpData = helpResponse.ok ? await helpResponse.json() : { sessions: [] };

      console.log('📈 Contribution data received:', {
        busSpots: spotData.reports?.length || 0,
        verifications: verifyData.verifications?.length || 0,
        helpSessions: helpData.sessions?.length || 0,
        totalPoints: socialData.profile?.total_points || 0,
        spotData: spotData.reports?.slice(0, 2) // Show first 2 for debugging
      });

      setContributionStats({
        busSpots: spotData.reports?.length || 0,
        verifications: verifyData.verifications?.length || 0,
        helpSessions: helpData.sessions?.length || 0,
        totalPoints: socialData.profile?.total_points || 0
      });
    } catch (error) {
      console.error('Error fetching contribution stats:', error);
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

      {/* Community Contribution Stats */}
      <div className="contribution-preview">
        <h3>🏆 Community Contributions</h3>
        <div className="contribution-stats-grid">
          <div className="contribution-stat">
            <span className="contrib-number">🚌 {contributionStats.busSpots}</span>
            <span className="contrib-label">Bus Spots</span>
          </div>
          <div className="contribution-stat">
            <span className="contrib-number">✅ {contributionStats.verifications}</span>
            <span className="contrib-label">Verifications</span>
          </div>
          <div className="contribution-stat">
            <span className="contrib-number">🤝 {contributionStats.helpSessions}</span>
            <span className="contrib-label">Help Sessions</span>
          </div>
          <div className="contribution-stat">
            <span className="contrib-number">⭐ {contributionStats.totalPoints}</span>
            <span className="contrib-label">Total Points</span>
          </div>
        </div>
        <button 
          className="view-contributions-btn"
          onClick={() => setShowContributions(true)}
        >
          📋 View All Contributions
        </button>
      </div>

      {/* Action Buttons */}
      <div className="profile-actions">
        <button 
          className="preferences-btn"
          onClick={() => setShowPreferences(true)}
        >
          ⚙️ Preferences
        </button>
        <button 
          className="logout-btn"
          onClick={handleLogout}
        >
          🚪 Logout
        </button>
      </div>

      {/* Content Sections */}
      <div className="profile-sections">
        {/* Saved Places - Compact Version */}
        <div className="section-card">
          <h3>🏠 Saved Places</h3>
          <p>No saved places yet. Add your favorite locations to get started!</p>
        </div>
      </div>

      {/* User Preferences Modal */}
      <UserPreferences 
        user={user}
        isOpen={showPreferences}
        onClose={() => setShowPreferences(false)}
      />

      {/* User Contributions Modal */}
      {showContributions && (
        <div className="modal-overlay" onClick={() => setShowContributions(false)}>
          <div className="modal-content contributions-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>My Contributions</h2>
              <button 
                className="modal-close-btn"
                onClick={() => setShowContributions(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <UserContributionHistory 
                userId={user.id} 
                user={user}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;