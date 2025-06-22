import { useState, useEffect } from 'react';
import './UserContributionHistory.css';

/**
 * User's personal contribution history and statistics
 * Shows bus spots, verifications, help sessions, and achievements
 */
function UserContributionHistory({ userId, user }) {
  const [contributions, setContributions] = useState([]);
  const [socialScore, setSocialScore] = useState(null);
  const [stats, setStats] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [timeRange, setTimeRange] = useState('30d');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchUserContributions();
      fetchUserScore();
    }
  }, [userId, selectedFilter, timeRange]);

  const fetchUserContributions = async () => {
    setIsLoading(true);
    try {
      // Fetch user's bus spot reports
      const spotsResponse = await fetch(`/api/users/${userId}/history?type=spot_reports&timeRange=${timeRange}`);
      const spotsData = spotsResponse.ok ? await spotsResponse.json() : { reports: [] };

      // Fetch user's verifications given
      const verificationsResponse = await fetch(`/api/users/${userId}/history?type=verifications&timeRange=${timeRange}`);
      const verificationsData = verificationsResponse.ok ? await verificationsResponse.json() : { verifications: [] };

      // Fetch user's help sessions
      const helpResponse = await fetch(`/api/users/${userId}/history?type=help_sessions&timeRange=${timeRange}`);
      const helpData = helpResponse.ok ? await helpResponse.json() : { sessions: [] };

      // Combine and sort by timestamp
      const allContributions = [
        ...spotsData.reports?.map(report => ({
          id: `spot-${report.id}`,
          type: 'bus_spot',
          timestamp: report.reported_at,
          data: report
        })) || [],
        ...verificationsData.verifications?.map(verification => ({
          id: `verify-${verification.id}`,
          type: 'verification',
          timestamp: verification.verified_at,
          data: verification
        })) || [],
        ...helpData.sessions?.map(session => ({
          id: `help-${session.id}`,
          type: 'help_session',
          timestamp: session.start_time,
          data: session
        })) || []
      ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      // Filter by type if selected
      const filteredContributions = selectedFilter === 'all' 
        ? allContributions 
        : allContributions.filter(contrib => contrib.type === selectedFilter);

      setContributions(filteredContributions);

      // Calculate stats
      const spotReports = allContributions.filter(c => c.type === 'bus_spot').length;
      const verifications = allContributions.filter(c => c.type === 'verification').length;
      const helpSessions = allContributions.filter(c => c.type === 'help_session').length;
      const totalCredits = spotsData.total_credits || 0;

      setStats({
        spotReports,
        verifications,
        helpSessions,
        totalCredits,
        totalContributions: spotReports + verifications + helpSessions
      });

    } catch (error) {
      console.error('Error fetching contributions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserScore = async () => {
    try {
      const response = await fetch(`/api/social/profile/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setSocialScore(data.profile);
      }
    } catch (error) {
      console.error('Error fetching social score:', error);
    }
  };

  const getContributionIcon = (type) => {
    const icons = {
      bus_spot: '🚌',
      verification: '✅',
      help_session: '🤝'
    };
    return icons[type] || '📍';
  };

  const getContributionTitle = (contribution) => {
    switch (contribution.type) {
      case 'bus_spot':
        return `Bus ${contribution.data.bus_number} spotted`;
      case 'verification':
        return `Verified bus spot`;
      case 'help_session':
        return `Helped at ${contribution.data.bus_stop_name}`;
      default:
        return 'Contribution';
    }
  };

  const getContributionDescription = (contribution) => {
    switch (contribution.type) {
      case 'bus_spot':
        const confidence = contribution.data.confidence_level;
        const hasPhoto = contribution.data.photo_path;
        return `${confidence} confidence${hasPhoto ? ' • Photo included' : ''}`;
      case 'verification':
        return `${contribution.data.is_accurate ? 'Confirmed' : 'Disputed'} accuracy`;
      case 'help_session':
        const duration = contribution.data.duration_minutes;
        const helped = contribution.data.people_helped;
        return `${duration}min session • ${helped} people helped`;
      default:
        return '';
    }
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffDays = Math.floor((now - time) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  const getReputationEmoji = (level) => {
    const emojis = {
      bronze: '🥉',
      silver: '🥈', 
      gold: '🥇',
      diamond: '💎'
    };
    return emojis[level] || '🥉';
  };

  if (isLoading) {
    return (
      <div className="contribution-history loading">
        <div className="loading-skeleton stats"></div>
        <div className="loading-skeleton filters"></div>
        <div className="loading-list">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="loading-skeleton item"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="contribution-history">
      {/* User Stats Header */}
      {socialScore && (
        <div className="contribution-stats">
          <div className="stats-header">
            <div className="user-info">
              <h2>
                {getReputationEmoji(socialScore.reputation_level)} Your Contributions
              </h2>
              <p>{user?.username || 'Community Member'}</p>
            </div>
            <div className="reputation-badge">
              <span className="reputation-level">{socialScore.reputation_level}</span>
              <span className="total-points">{socialScore.total_points} pts</span>
            </div>
          </div>
          
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-icon">🚌</span>
              <span className="stat-value">{stats?.spotReports || 0}</span>
              <span className="stat-label">Bus Spots</span>
            </div>
            <div className="stat-card">
              <span className="stat-icon">✅</span>
              <span className="stat-value">{stats?.verifications || 0}</span>
              <span className="stat-label">Verifications</span>
            </div>
            <div className="stat-card">
              <span className="stat-icon">🤝</span>
              <span className="stat-value">{stats?.helpSessions || 0}</span>
              <span className="stat-label">Help Sessions</span>
            </div>
            <div className="stat-card">
              <span className="stat-icon">⭐</span>
              <span className="stat-value">{socialScore.total_points}</span>
              <span className="stat-label">Total Credits</span>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="contribution-filters">
        <div className="filter-group">
          <label>Show:</label>
          <select value={selectedFilter} onChange={(e) => setSelectedFilter(e.target.value)}>
            <option value="all">All Contributions</option>
            <option value="bus_spot">Bus Spots</option>
            <option value="verification">Verifications</option>
            <option value="help_session">Help Sessions</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Period:</label>
          <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 3 months</option>
            <option value="1y">Last year</option>
            <option value="all">All time</option>
          </select>
        </div>
      </div>

      {/* Contribution List */}
      <div className="contribution-list">
        {contributions.length === 0 ? (
          <div className="empty-contributions">
            <span className="empty-icon">🌟</span>
            <h3>No contributions yet</h3>
            <p>Start contributing to the community by spotting buses, verifying reports, or helping fellow travelers!</p>
          </div>
        ) : (
          contributions.map(contribution => (
            <div key={contribution.id} className={`contribution-item ${contribution.type}`}>
              <div className="contribution-icon">
                {getContributionIcon(contribution.type)}
              </div>
              <div className="contribution-content">
                <div className="contribution-header">
                  <h4 className="contribution-title">{getContributionTitle(contribution)}</h4>
                  <span className="contribution-time">{getTimeAgo(contribution.timestamp)}</span>
                </div>
                <p className="contribution-description">{getContributionDescription(contribution)}</p>
                {contribution.data.additional_info && (
                  <p className="contribution-notes">{contribution.data.additional_info}</p>
                )}
              </div>
              <div className="contribution-status">
                {contribution.type === 'bus_spot' && (
                  <span className={`status-badge ${contribution.data.is_verified ? 'verified' : 'pending'}`}>
                    {contribution.data.is_verified ? '✅ Verified' : '⏳ Pending'}
                  </span>
                )}
                {contribution.type === 'verification' && (
                  <span className={`status-badge ${contribution.data.is_accurate ? 'accurate' : 'disputed'}`}>
                    {contribution.data.is_accurate ? '✅ Confirmed' : '❌ Disputed'}
                  </span>
                )}
                {contribution.type === 'help_session' && (
                  <span className="status-badge completed">
                    ✅ Completed
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default UserContributionHistory;