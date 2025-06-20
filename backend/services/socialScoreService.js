const { db } = require('../database');

class SocialScoreService {
  constructor() {
    this.weights = {
      accuracy: 0.4,      // 40% - How accurate are their predictions
      consistency: 0.2,   // 20% - Regular contributions  
      community: 0.3,     // 30% - Peer validations
      experience: 0.1     // 10% - Time and contributions
    };
  }

  async initializeUserScore(userId) {
    return new Promise((resolve, reject) => {
      db.run(`
        INSERT OR IGNORE INTO user_social_scores 
        (user_id, accuracy_score, contribution_count, verification_score, reputation_level, total_distance_tracked, badges_earned, total_points)
        VALUES (?, 0, 0, 0, 'bronze', 0, '[]', 0)
      `, [userId], function(err) {
        if (err) reject(err);
        else resolve({ 
          user_id: userId, 
          initialized: this.changes > 0,
          existing: this.changes === 0 
        });
      });
    });
  }

  async getUserScore(userId) {
    return new Promise((resolve, reject) => {
      db.get(`
        SELECT * FROM user_social_scores 
        WHERE user_id = ?
      `, [userId], (err, row) => {
        if (err) reject(err);
        else if (!row) {
          // Initialize if doesn't exist
          this.initializeUserScore(userId).then(() => {
            this.getUserScore(userId).then(resolve).catch(reject);
          }).catch(reject);
        } else {
          // Parse JSON fields
          row.badges_earned = JSON.parse(row.badges_earned || '[]');
          resolve(row);
        }
      });
    });
  }

  async calculateSocialScore(userId) {
    const userStats = await this.getUserStats(userId);
    const accuracyScore = this.calculateAccuracyScore(userStats);
    const consistencyScore = this.calculateConsistencyScore(userStats);
    const communityScore = this.calculateCommunityScore(userStats);
    const experienceScore = this.calculateExperienceScore(userStats);

    const totalScore = Math.round(
      accuracyScore * this.weights.accuracy +
      consistencyScore * this.weights.consistency +
      communityScore * this.weights.community +
      experienceScore * this.weights.experience
    );

    const reputationLevel = this.getReputationLevel(totalScore);

    await this.updateUserScore(userId, {
      accuracy_score: accuracyScore,
      verification_score: communityScore,
      reputation_level: reputationLevel,
      total_points: totalScore
    });

    return {
      total_score: totalScore,
      accuracy_score: accuracyScore,
      consistency_score: consistencyScore,
      community_score: communityScore,
      experience_score: experienceScore,
      reputation_level: reputationLevel,
      breakdown: {
        accuracy: `${accuracyScore} × ${this.weights.accuracy} = ${(accuracyScore * this.weights.accuracy).toFixed(1)}`,
        consistency: `${consistencyScore} × ${this.weights.consistency} = ${(consistencyScore * this.weights.consistency).toFixed(1)}`,
        community: `${communityScore} × ${this.weights.community} = ${(communityScore * this.weights.community).toFixed(1)}`,
        experience: `${experienceScore} × ${this.weights.experience} = ${(experienceScore * this.weights.experience).toFixed(1)}`
      }
    };
  }

  async getUserStats(userId) {
    return new Promise((resolve, reject) => {
      const queries = [
        // Prediction accuracy stats
        `SELECT 
           COUNT(*) as total_predictions,
           AVG(CASE WHEN accuracy_percentage >= 80 THEN 1 ELSE 0 END) * 100 as accuracy_rate,
           AVG(accuracy_percentage) as avg_accuracy
         FROM arrival_predictions ap
         JOIN live_tracking lt ON ap.route_id = lt.route_id
         WHERE lt.user_id = ? AND ap.actual_arrival_time IS NOT NULL`,

        // Verification stats (given and received)
        `SELECT 
           COUNT(CASE WHEN tracker_user_id = ? THEN 1 END) as verifications_received,
           COUNT(CASE WHEN verifier_user_id = ? THEN 1 END) as verifications_given,
           AVG(CASE WHEN tracker_user_id = ? THEN accuracy_rating END) as avg_rating_received,
           AVG(CASE WHEN verifier_user_id = ? THEN accuracy_rating END) as avg_rating_given
         FROM community_verifications 
         WHERE tracker_user_id = ? OR verifier_user_id = ?`,

        // Tracking activity stats
        `SELECT 
           COUNT(*) as total_sessions,
           SUM(total_distance_tracked) as total_distance,
           COUNT(DISTINCT DATE(tracking_start_time)) as active_days,
           MAX(tracking_start_time) as last_activity
         FROM user_social_scores uss
         JOIN live_tracking lt ON uss.user_id = lt.user_id
         WHERE uss.user_id = ?`,

        // Current streak calculation
        `SELECT COUNT(*) as current_streak
         FROM (
           SELECT DISTINCT DATE(tracking_start_time) as tracking_date
           FROM live_tracking 
           WHERE user_id = ? 
           ORDER BY tracking_date DESC
           LIMIT 30
         ) recent_days`
      ];

      const results = {};
      let completed = 0;

      queries.forEach((query, index) => {
        const params = index === 0 ? [userId] :
                     index === 1 ? [userId, userId, userId, userId, userId, userId] :
                     index === 2 ? [userId] : [userId];

        db.get(query, params, (err, row) => {
          if (err) {
            reject(err);
            return;
          }

          switch(index) {
            case 0: results.predictions = row; break;
            case 1: results.verifications = row; break;
            case 2: results.activity = row; break;
            case 3: results.streak = row; break;
          }

          completed++;
          if (completed === queries.length) {
            resolve({
              total_predictions: results.predictions?.total_predictions || 0,
              accuracy_rate: results.predictions?.accuracy_rate || 0,
              avg_accuracy: results.predictions?.avg_accuracy || 0,
              verifications_received: results.verifications?.verifications_received || 0,
              verifications_given: results.verifications?.verifications_given || 0,
              avg_rating_received: results.verifications?.avg_rating_received || 0,
              avg_rating_given: results.verifications?.avg_rating_given || 0,
              total_sessions: results.activity?.total_sessions || 0,
              total_distance: results.activity?.total_distance || 0,
              active_days: results.activity?.active_days || 0,
              current_streak: results.streak?.current_streak || 0,
              last_activity: results.activity?.last_activity
            });
          }
        });
      });
    });
  }

  calculateAccuracyScore(stats) {
    const { total_predictions, accuracy_rate, avg_accuracy } = stats;
    
    if (total_predictions === 0) return 0;
    
    // Combine prediction accuracy rate and average accuracy
    const accuracyComponent = (accuracy_rate + avg_accuracy) / 2;
    
    // Apply confidence factor based on number of predictions
    let confidenceFactor = 1.0;
    if (total_predictions < 5) confidenceFactor = 0.3;
    else if (total_predictions < 20) confidenceFactor = 0.7;
    else if (total_predictions < 50) confidenceFactor = 0.9;
    
    return Math.round(accuracyComponent * confidenceFactor);
  }

  calculateConsistencyScore(stats) {
    const { active_days, current_streak, total_sessions } = stats;
    
    // Base score from active days (max 30 points)
    const activeDaysScore = Math.min(active_days * 2, 30);
    
    // Streak bonus (max 40 points)
    const streakScore = Math.min(current_streak * 5, 40);
    
    // Session frequency (max 30 points)
    const sessionScore = Math.min(total_sessions, 30);
    
    return Math.round((activeDaysScore + streakScore + sessionScore) / 3);
  }

  calculateCommunityScore(stats) {
    const { verifications_received, verifications_given, avg_rating_received, avg_rating_given } = stats;
    
    // Score based on verifications received (others validating your work)
    const receivedScore = Math.min(verifications_received * 5, 50);
    
    // Score based on verifications given (community participation)
    const givenScore = Math.min(verifications_given * 3, 30);
    
    // Rating quality bonus
    const ratingBonus = ((avg_rating_received || 0) + (avg_rating_given || 0)) / 2;
    
    return Math.round((receivedScore + givenScore) * (1 + ratingBonus / 100));
  }

  calculateExperienceScore(stats) {
    const { total_distance, total_sessions, active_days } = stats;
    
    // Distance component (max 40 points)
    const distanceScore = Math.min(total_distance / 10, 40); // 1 point per 10km
    
    // Session experience (max 35 points)
    const sessionScore = Math.min(total_sessions, 35);
    
    // Longevity bonus (max 25 points)
    const longevityScore = Math.min(active_days, 25);
    
    return Math.round((distanceScore + sessionScore + longevityScore) / 3);
  }

  getReputationLevel(score) {
    if (score >= 86) return 'diamond';
    if (score >= 61) return 'gold';
    if (score >= 26) return 'silver';
    return 'bronze';
  }

  async updateUserScore(userId, scoreData) {
    return new Promise((resolve, reject) => {
      const { accuracy_score, verification_score, reputation_level, total_points } = scoreData;
      
      db.run(`
        UPDATE user_social_scores 
        SET accuracy_score = ?, verification_score = ?, reputation_level = ?, 
            total_points = ?, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `, [accuracy_score, verification_score, reputation_level, total_points, userId], 
      function(err) {
        if (err) reject(err);
        else resolve({ updated: this.changes > 0 });
      });
    });
  }

  async addContribution(userId, contributionData) {
    return new Promise((resolve, reject) => {
      const { distance = 0, session_duration = 0 } = contributionData;
      
      db.run(`
        UPDATE user_social_scores 
        SET contribution_count = contribution_count + 1,
            total_distance_tracked = total_distance_tracked + ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `, [distance, userId], function(err) {
        if (err) reject(err);
        else {
          // Recalculate social score after contribution
          resolve({ contribution_added: this.changes > 0 });
        }
      });
    });
  }

  async getLeaderboard(limit = 10, timeframe = 'all') {
    return new Promise((resolve, reject) => {
      let query = `
        SELECT uss.*, u.username
        FROM user_social_scores uss
        JOIN users u ON uss.user_id = u.id
        WHERE uss.total_points > 0
      `;

      if (timeframe !== 'all') {
        const days = timeframe === 'week' ? 7 : timeframe === 'month' ? 30 : 365;
        query += ` AND uss.updated_at >= datetime('now', '-${days} days')`;
      }

      query += ` ORDER BY uss.total_points DESC, uss.accuracy_score DESC LIMIT ?`;

      db.all(query, [limit], (err, rows) => {
        if (err) reject(err);
        else {
          const leaderboard = rows.map((row, index) => ({
            rank: index + 1,
            user_id: row.user_id,
            username: row.username,
            total_points: row.total_points,
            accuracy_score: row.accuracy_score,
            reputation_level: row.reputation_level,
            contribution_count: row.contribution_count,
            badges_earned: JSON.parse(row.badges_earned || '[]')
          }));
          resolve(leaderboard);
        }
      });
    });
  }
}

module.exports = { SocialScoreService };