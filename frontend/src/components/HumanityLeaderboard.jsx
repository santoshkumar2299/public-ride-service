import { useState, useEffect } from 'react';
import './HumanityLeaderboard.css';

const HumanityLeaderboard = ({ user }) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('all_time');
  const [isLoading, setIsLoading] = useState(true);
  const [userRank, setUserRank] = useState(null);

  useEffect(() => {
    fetchLeaderboard();
  }, [selectedPeriod]);

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/humanity-credits/leaderboard?period=${selectedPeriod}&limit=100`
      );
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data.leaderboard || []);
        
        // Find current user's rank
        if (user?.id) {
          const userEntry = data.leaderboard.find(entry => entry.user_id === user.id);
          setUserRank(userEntry ? userEntry.rank : null);
        }
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
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

  const getRankEmoji = (rank) => {
    if (rank === 1) return '🏆';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    if (rank <= 10) return '⭐';
    return '🎯';
  };

  const getPeriodDisplay = (period) => {
    const displays = {
      all_time: 'All Time Heroes',
      this_month: 'This Month\'s Champions',
      this_week: 'This Week\'s Stars'
    };
    return displays[period] || displays.all_time;
  };

  const formatCredits = (credits) => {
    if (credits >= 1000) {
      return `${(credits / 1000).toFixed(1)}k`;
    }
    return credits.toString();
  };

  if (isLoading) {
    return (
      <div className="humanity-leaderboard loading">
        <div className="loading-header">
          <div className="loading-skeleton title"></div>
          <div className="loading-skeleton subtitle"></div>
        </div>
        <div className="loading-list">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="loading-skeleton item"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="humanity-leaderboard">
      <div className="leaderboard-header">
        <div className="header-content">
          <h2>🏆 Humanity Heroes</h2>
          <p>Community members making transit better for everyone!</p>
        </div>
        
        <div className="period-selector">
          {['all_time', 'this_month', 'this_week'].map(period => (
            <button
              key={period}
              className={`period-btn ${selectedPeriod === period ? 'active' : ''}`}
              onClick={() => setSelectedPeriod(period)}
            >
              {period === 'all_time' ? 'All Time' : 
               period === 'this_month' ? 'This Month' : 'This Week'}
            </button>
          ))}
        </div>
      </div>

      {/* Current User Rank Display */}
      {userRank && (
        <div className="user-rank-card">
          <div className="rank-content">
            <span className="rank-emoji">{getRankEmoji(userRank)}</span>
            <div className="rank-text">
              <span className="rank-label">Your Rank</span>
              <span className="rank-number">#{userRank}</span>
            </div>
            <div className="rank-encouragement">
              {userRank <= 3 ? "You're a top hero! 🎉" :
               userRank <= 10 ? "Amazing work! Keep it up! 💪" :
               userRank <= 50 ? "Great contribution! 🌟" :
               "Every help counts! Keep going! 🚀"}
            </div>
          </div>
        </div>
      )}

      {/* Top 3 Podium */}
      {leaderboard.length >= 3 && (
        <div className="podium-section">
          <div className="podium">
            {/* Second Place */}
            <div className="podium-position second">
              <div className="helper-avatar">
                <span className="helper-level" style={{ color: getHelperLevelColor(leaderboard[1].helper_level) }}>
                  {getHelperLevelEmoji(leaderboard[1].helper_level)}
                </span>
              </div>
              <div className="podium-info">
                <span className="position-number">2</span>
                <span className="helper-name">{leaderboard[1].username}</span>
                <span className="helper-credits">{formatCredits(leaderboard[1].total_credits)} credits</span>
                <span className="helper-helped">{leaderboard[1].total_people_helped} helped</span>
              </div>
              <div className="podium-platform second-platform">🥈</div>
            </div>

            {/* First Place */}
            <div className="podium-position first">
              <div className="helper-avatar champion">
                <span className="helper-level" style={{ color: getHelperLevelColor(leaderboard[0].helper_level) }}>
                  {getHelperLevelEmoji(leaderboard[0].helper_level)}
                </span>
                <div className="crown">👑</div>
              </div>
              <div className="podium-info">
                <span className="position-number">1</span>
                <span className="helper-name">{leaderboard[0].username}</span>
                <span className="helper-credits">{formatCredits(leaderboard[0].total_credits)} credits</span>
                <span className="helper-helped">{leaderboard[0].total_people_helped} helped</span>
              </div>
              <div className="podium-platform first-platform">🏆</div>
            </div>

            {/* Third Place */}
            <div className="podium-position third">
              <div className="helper-avatar">
                <span className="helper-level" style={{ color: getHelperLevelColor(leaderboard[2].helper_level) }}>
                  {getHelperLevelEmoji(leaderboard[2].helper_level)}
                </span>
              </div>
              <div className="podium-info">
                <span className="position-number">3</span>
                <span className="helper-name">{leaderboard[2].username}</span>
                <span className="helper-credits">{formatCredits(leaderboard[2].total_credits)} credits</span>
                <span className="helper-helped">{leaderboard[2].total_people_helped} helped</span>
              </div>
              <div className="podium-platform third-platform">🥉</div>
            </div>
          </div>
        </div>
      )}

      {/* Full Leaderboard List */}
      <div className="leaderboard-section">
        <div className="section-header">
          <h3>{getPeriodDisplay(selectedPeriod)}</h3>
          <span className="total-count">{leaderboard.length} heroes</span>
        </div>

        <div className="leaderboard-list">
          {leaderboard.map((helper, index) => (
            <div 
              key={helper.user_id} 
              className={`leaderboard-item ${helper.user_id === user?.id ? 'current-user' : ''} ${index < 3 ? 'top-three' : ''}`}
            >
              <div className="rank-section">
                <span className="rank-emoji">{getRankEmoji(helper.rank)}</span>
                <span className="rank-number">#{helper.rank}</span>
              </div>

              <div className="helper-section">
                <div className="helper-info">
                  <span className="helper-level" style={{ color: getHelperLevelColor(helper.helper_level) }}>
                    {getHelperLevelEmoji(helper.helper_level)}
                  </span>
                  <div className="helper-details">
                    <span className="helper-name">
                      {helper.username}
                      {helper.user_id === user?.id && <span className="you-badge">You</span>}
                    </span>
                    <span className="helper-level-text">{helper.helper_level.replace('_', ' ')}</span>
                  </div>
                </div>
              </div>

              <div className="stats-section">
                <div className="stat-group">
                  <span className="stat-value">{formatCredits(helper.total_credits)}</span>
                  <span className="stat-label">Credits</span>
                </div>
                <div className="stat-group">
                  <span className="stat-value">{helper.total_people_helped}</span>
                  <span className="stat-label">Helped</span>
                </div>
                <div className="stat-group">
                  <span className="stat-value">⭐ {helper.average_rating.toFixed(1)}</span>
                  <span className="stat-label">Rating</span>
                </div>
                {helper.recent_avg_rating && helper.recent_avg_rating !== helper.average_rating && (
                  <div className="stat-group recent">
                    <span className="stat-value">📈 {helper.recent_avg_rating.toFixed(1)}</span>
                    <span className="stat-label">Recent</span>
                  </div>
                )}
              </div>

              {/* Special Badges */}
              {helper.badges_earned && helper.badges_earned.length > 0 && (
                <div className="badges-section">
                  {helper.badges_earned.slice(0, 3).map((badge, badgeIndex) => (
                    <span key={badgeIndex} className="badge">{badge}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Call to Action for Non-helpers */}
        {leaderboard.length === 0 && (
          <div className="empty-leaderboard">
            <div className="empty-content">
              <span className="empty-icon">🌟</span>
              <h3>Be the First Hero!</h3>
              <p>Start helping fellow travelers at bus stops and earn your place on the leaderboard!</p>
              <div className="empty-benefits">
                <div className="benefit">
                  <span>🤝</span>
                  <span>Help Others</span>
                </div>
                <div className="benefit">
                  <span>⭐</span>
                  <span>Earn Credits</span>
                </div>
                <div className="benefit">
                  <span>🏆</span>
                  <span>Gain Recognition</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Motivational Footer */}
        <div className="leaderboard-footer">
          <div className="footer-content">
            <span className="footer-icon">💝</span>
            <div className="footer-text">
              <span className="footer-title">Making Transit Better Together</span>
              <span className="footer-subtitle">Every small help creates a big impact on our community</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HumanityLeaderboard;