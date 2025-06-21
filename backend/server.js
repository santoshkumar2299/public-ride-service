require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const { db, initDB } = require('./database');
const { findMatches, createMatch } = require('./matching');
const { TransportService } = require('./services/transportService');
const { SocialScoreService } = require('./services/socialScoreService');

// Initialize services
const transportService = new TransportService();
const socialScoreService = new SocialScoreService();

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

app.use(helmet());
app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
  credentials: true
}));
app.use(morgan(process.env.LOG_LEVEL || 'combined'));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Authentication endpoints
app.post('/api/auth/register', async (req, res) => {
  const { username, email, password } = req.body;
  
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email, and password are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    // Check if user already exists
    db.get('SELECT id FROM users WHERE username = ? OR email = ?', [username, email], async (err, existingUser) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (existingUser) {
        return res.status(409).json({ error: 'Username or email already exists' });
      }

      // Hash password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);
      const userId = uuidv4();

      // Create user
      const sql = 'INSERT INTO users (id, username, email, password_hash) VALUES (?, ?, ?, ?)';
      db.run(sql, [userId, username, email, passwordHash], function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to create user' });
        }
        
        res.status(201).json({
          message: 'User created successfully',
          user: { id: userId, username, email }
        });
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    try {
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }

      res.json({
        message: 'Login successful',
        user: { id: user.id, username: user.username, email: user.email }
      });
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });
});

app.get('/api/rides', (req, res) => {
  db.all('SELECT * FROM rides WHERE status = "active"', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ rides: rows });
  });
});

app.post('/api/rides', (req, res) => {
  const { user_id, rider_name, destination, destination_lat, destination_lng, current_lat, current_lng } = req.body;
  
  if (!user_id || !rider_name || !destination || !destination_lat || !destination_lng) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const id = uuidv4();
  const sql = `INSERT INTO rides (id, user_id, rider_name, destination, destination_lat, destination_lng, current_lat, current_lng) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
  
  db.run(sql, [id, user_id, rider_name, destination, destination_lat, destination_lng, current_lat, current_lng], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ message: 'Ride created', id });
  });
});

app.get('/api/rides/:id', (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT * FROM rides WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Ride not found' });
    }
    res.json(row);
  });
});

app.patch('/api/rides/:id/location', (req, res) => {
  const { id } = req.params;
  const { current_lat, current_lng } = req.body;
  
  if (!current_lat || !current_lng) {
    return res.status(400).json({ error: 'Missing location coordinates' });
  }

  db.run('UPDATE rides SET current_lat = ?, current_lng = ? WHERE id = ?', 
         [current_lat, current_lng, id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Ride not found' });
    }
    res.json({ message: 'Location updated' });
  });
});

app.get('/api/requests', (req, res) => {
  db.all('SELECT * FROM requests WHERE status = "pending"', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ requests: rows });
  });
});

app.post('/api/requests', (req, res) => {
  const { user_id, passenger_name, pickup_lat, pickup_lng, destination_lat, destination_lng, max_walk_distance } = req.body;
  
  if (!user_id || !passenger_name || !pickup_lat || !pickup_lng || !destination_lat || !destination_lng) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const id = uuidv4();
  const sql = `INSERT INTO requests (id, user_id, passenger_name, pickup_lat, pickup_lng, destination_lat, destination_lng, max_walk_distance) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
  
  db.run(sql, [id, user_id, passenger_name, pickup_lat, pickup_lng, destination_lat, destination_lng, max_walk_distance || 1000], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ message: 'Request created', id });
  });
});

app.get('/api/requests/:id', (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT * FROM requests WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Request not found' });
    }
    res.json(row);
  });
});

app.get('/api/matches', (req, res) => {
  const { passengerId } = req.query;
  
  if (!passengerId) {
    return res.status(400).json({ error: 'passengerId query parameter required' });
  }

  findMatches(passengerId, (err, matches) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ matches });
  });
});

app.post('/api/matches', (req, res) => {
  const { ride_id, request_id, meeting_lat, meeting_lng } = req.body;
  
  if (!ride_id || !request_id || !meeting_lat || !meeting_lng) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  createMatch(ride_id, request_id, meeting_lat, meeting_lng, (err, match) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ message: 'Match created', match });
  });
});

app.get('/api/rides/:id/matches', (req, res) => {
  const { id } = req.params;
  
  const sql = `
    SELECT m.*, r.passenger_name, r.pickup_lat, r.pickup_lng, 
           r.destination_lat, r.destination_lng, r.max_walk_distance
    FROM matches m
    JOIN requests r ON m.request_id = r.id
    WHERE m.ride_id = ? AND m.status = 'matched'
    ORDER BY m.created_at DESC
  `;
  
  db.all(sql, [id], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ matches: rows });
  });
});

app.get('/api/rides/:id/status', (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT * FROM rides WHERE id = ?', [id], (err, ride) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!ride) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    const sql = `
      SELECT COUNT(*) as match_count
      FROM matches 
      WHERE ride_id = ? AND status = 'matched'
    `;
    
    db.get(sql, [id], (err, result) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      res.json({
        ride,
        match_count: result.match_count,
        has_new_matches: result.match_count > 0
      });
    });
  });
});

// Update ride status
app.patch('/api/rides/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }

  db.run('UPDATE rides SET status = ? WHERE id = ?', [status, id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Ride not found' });
    }
    res.json({ message: 'Ride status updated' });
  });
});

// Update request status
app.patch('/api/requests/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }

  db.run('UPDATE requests SET status = ? WHERE id = ?', [status, id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }
    res.json({ message: 'Request status updated' });
  });
});

// User history endpoints
app.get('/api/users/:userId/history', (req, res) => {
  const { userId } = req.params;
  
  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  // Get user's rides and requests
  const ridesPromise = new Promise((resolve, reject) => {
    db.all('SELECT * FROM rides WHERE user_id = ? ORDER BY created_at DESC', [userId], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

  const requestsPromise = new Promise((resolve, reject) => {
    db.all('SELECT * FROM requests WHERE user_id = ? ORDER BY created_at DESC', [userId], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

  Promise.all([ridesPromise, requestsPromise])
    .then(([rides, requests]) => {
      res.json({
        rides: rides,
        requests: requests
      });
    })
    .catch(err => {
      res.status(500).json({ error: 'Failed to fetch user history' });
    });
});

// Get recent locations for a user (for location picker)
app.get('/api/users/:userId/recent-locations', (req, res) => {
  const { userId } = req.params;
  const limit = parseInt(req.query.limit) || 5;
  
  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  // Get unique recent locations from both rides and requests
  const sql = `
    SELECT DISTINCT 
      destination as address,
      destination_lat as lat,
      destination_lng as lng,
      'destination' as type,
      MAX(created_at) as last_used
    FROM rides 
    WHERE user_id = ? AND destination IS NOT NULL AND destination != ''
    GROUP BY destination, destination_lat, destination_lng
    
    ORDER BY last_used DESC
    LIMIT ?
  `;
  
  db.all(sql, [userId, limit], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch recent locations' });
    }
    
    res.json({
      recentLocations: rows
    });
  });
});

// TRANSPORT API ENDPOINTS

// Get all transport types
app.get('/api/transports/types', async (req, res) => {
  try {
    const types = await transportService.getAllTransportTypes();
    res.json({ transport_types: types });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get routes by transport type
app.get('/api/transports/routes', async (req, res) => {
  try {
    const { type_id, city_id } = req.query;
    
    if (!type_id) {
      return res.status(400).json({ error: 'type_id query parameter required' });
    }

    const routes = await transportService.getRoutesByTransportType(type_id, city_id);
    res.json({ routes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get stops for a specific route
app.get('/api/transports/routes/:id/stops', async (req, res) => {
  try {
    const { id } = req.params;
    const stops = await transportService.getRouteStops(id);
    res.json({ stops });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new route (admin functionality)
app.post('/api/transports/routes', async (req, res) => {
  try {
    const route = await transportService.createRoute(req.body);
    res.status(201).json({ message: 'Route created', route });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add a stop to a route
app.post('/api/transports/routes/:id/stops', async (req, res) => {
  try {
    const { id } = req.params;
    const stop = await transportService.addStopToRoute(id, req.body);
    res.status(201).json({ message: 'Stop added', stop });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start tracking a route
app.post('/api/tracking/start', async (req, res) => {
  try {
    const { user_id, route_id, location } = req.body;
    
    if (!user_id || !route_id || !location) {
      return res.status(400).json({ error: 'user_id, route_id, and location are required' });
    }

    // Initialize user social score if not exists
    await socialScoreService.initializeUserScore(user_id);
    
    const tracking = await transportService.startTracking(user_id, route_id, location);
    res.status(201).json({ message: 'Tracking started', tracking });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update tracking location
app.patch('/api/tracking/:id/location', async (req, res) => {
  try {
    const { id } = req.params;
    const { location } = req.body;
    
    if (!location) {
      return res.status(400).json({ error: 'location is required' });
    }

    const result = await transportService.updateTrackingLocation(id, location);
    res.json({ message: 'Location updated', ...result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Stop tracking
app.post('/api/tracking/:id/stop', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await transportService.stopTracking(id);
    res.json({ message: 'Tracking stopped', ...result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get live tracking data for a route
app.get('/api/tracking/live/:routeId', async (req, res) => {
  try {
    const { routeId } = req.params;
    const liveData = await transportService.getLiveTracking(routeId);
    res.json({ live_tracking: liveData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// SOCIAL SCORING API ENDPOINTS

// Get user's social score
app.get('/api/social/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const score = await socialScoreService.getUserScore(userId);
    res.json({ profile: score });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Calculate and update user's social score
app.post('/api/social/calculate/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const scoreData = await socialScoreService.calculateSocialScore(userId);
    res.json({ message: 'Score calculated', ...scoreData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add a contribution (tracking session)
app.post('/api/social/contribution', async (req, res) => {
  try {
    const { user_id, distance, session_duration } = req.body;
    
    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    await socialScoreService.addContribution(user_id, { distance, session_duration });
    
    // Recalculate score after contribution
    const scoreData = await socialScoreService.calculateSocialScore(user_id);
    
    res.json({ message: 'Contribution added', ...scoreData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get leaderboard
app.get('/api/social/leaderboard', async (req, res) => {
  try {
    const { limit = 10, timeframe = 'all' } = req.query;
    const leaderboard = await socialScoreService.getLeaderboard(parseInt(limit), timeframe);
    res.json({ leaderboard });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PREDICTION API ENDPOINTS (Basic implementation)

// Get arrival prediction for a stop
app.get('/api/predictions/route/:routeId/stop/:stopId', async (req, res) => {
  try {
    const { routeId, stopId } = req.params;
    const { current_location } = req.query;
    
    if (!current_location) {
      return res.status(400).json({ error: 'current_location query parameter required' });
    }

    const location = JSON.parse(current_location);
    const route = await transportService.getRouteStops(routeId);
    const targetStop = route.find(stop => stop.id == stopId);
    
    if (!targetStop) {
      return res.status(404).json({ error: 'Stop not found' });
    }

    // Get the appropriate transport provider
    const provider = transportService.getProvider('bus'); // Default to bus for now
    const prediction = await provider.calculateETA(location, targetStop, { route_id: routeId });
    
    res.json({
      route_id: routeId,
      stop_id: stopId,
      predicted_arrival_time: new Date(Date.now() + prediction.eta_minutes * 60000).toISOString(),
      confidence_score: prediction.confidence,
      method: prediction.method,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// MAP-BASED API ENDPOINTS

// Get live buses in map viewport
app.post('/api/tracking/live/viewport', async (req, res) => {
  try {
    const { transport_type_id, bounds, zoom_level } = req.body;
    
    if (!transport_type_id || !bounds) {
      return res.status(400).json({ error: 'transport_type_id and bounds are required' });
    }

    // Get live tracking data within bounds
    const sql = `
      SELECT 
        t.id,
        t.user_id,
        t.route_id,
        t.current_lat,
        t.current_lng,
        t.speed,
        t.direction,
        t.last_update,
        r.route_number,
        r.route_name,
        r.start_point,
        r.end_point
      FROM live_tracking t
      JOIN transport_routes r ON t.route_id = r.id
      WHERE r.transport_type_id = ?
        AND t.is_active = 1
        AND t.current_lat BETWEEN ? AND ?
        AND t.current_lng BETWEEN ? AND ?
        AND datetime(t.last_update) > datetime('now', '-5 minutes')
      ORDER BY t.last_update DESC
    `;

    db.all(sql, [
      transport_type_id,
      bounds.south,
      bounds.north, 
      bounds.west,
      bounds.east
    ], (err, rows) => {
      if (err) {
        console.error('Error fetching viewport buses:', err);
        return res.status(500).json({ error: 'Failed to fetch buses' });
      }

      res.json({ 
        buses: rows || [],
        bounds: bounds,
        zoom_level: zoom_level,
        count: rows ? rows.length : 0
      });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search by bus number
app.get('/api/search/bus-number', async (req, res) => {
  try {
    const { query, lat, lng, radius = 5 } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'query parameter required' });
    }

    let distanceClause = '';
    let params = [`%${query}%`];
    
    if (lat && lng) {
      // Add distance calculation using Haversine formula
      distanceClause = `
        AND (
          6371 * acos(
            cos(radians(?)) * cos(radians(t.current_lat)) * 
            cos(radians(t.current_lng) - radians(?)) + 
            sin(radians(?)) * sin(radians(t.current_lat))
          )
        ) <= ?
      `;
      params.push(parseFloat(lat), parseFloat(lng), parseFloat(lat), parseFloat(radius));
    }

    const sql = `
      SELECT 
        r.route_number,
        r.route_name,
        r.start_point,
        r.end_point,
        COUNT(t.id) as buses_count,
        AVG(t.current_lat) as center_lat,
        AVG(t.current_lng) as center_lng,
        MIN(
          CASE WHEN ? IS NOT NULL AND ? IS NOT NULL THEN
            6371 * acos(
              cos(radians(?)) * cos(radians(t.current_lat)) * 
              cos(radians(t.current_lng) - radians(?)) + 
              sin(radians(?)) * sin(radians(t.current_lat))
            )
          ELSE NULL END
        ) as distance
      FROM transport_routes r
      LEFT JOIN live_tracking t ON r.id = t.route_id AND t.is_active = 1
      WHERE r.route_number LIKE ?
        ${distanceClause}
      GROUP BY r.id, r.route_number, r.route_name
      HAVING buses_count > 0
      ORDER BY 
        CASE WHEN ? IS NOT NULL THEN distance END ASC,
        buses_count DESC,
        r.route_number ASC
      LIMIT 10
    `;

    // Build parameters array for the complex query
    const searchParams = [
      lat, lng, lat, lng, lat, // For distance calculation in SELECT
      ...params, // Main query params (query + optional distance filter)
      lat // For ORDER BY distance
    ];

    db.all(sql, searchParams, (err, rows) => {
      if (err) {
        console.error('Error searching bus numbers:', err);
        return res.status(500).json({ error: 'Search failed' });
      }

      const results = rows.map(row => ({
        display_name: `Bus ${row.route_number}`,
        subtitle: `${row.route_name} (${row.start_point} → ${row.end_point})`,
        buses_count: row.buses_count,
        distance: row.distance,
        route_bounds: row.center_lat && row.center_lng ? {
          center_lat: row.center_lat,
          center_lng: row.center_lng
        } : null
      }));

      res.json({ results });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search by route name with smart matching
app.get('/api/search/route', async (req, res) => {
  try {
    const { query, lat, lng, radius = 5 } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'query parameter required' });
    }

    // Smart query processing - handle common variations
    const normalizedQuery = query.toLowerCase().trim();
    
    // Extract keywords for flexible matching
    const keywords = normalizedQuery.split(/[\s,\-→]+/).filter(k => k.length > 2);
    
    // Build flexible search conditions
    let searchConditions = [];
    let params = [];
    
    // Exact phrase match (highest priority)
    searchConditions.push(`(r.route_name LIKE ? OR r.start_point LIKE ? OR r.end_point LIKE ?)`);
    params.push(`%${query}%`, `%${query}%`, `%${query}%`);
    
    // Keyword-based matching for flexible search
    if (keywords.length > 0) {
      const keywordConditions = keywords.map(keyword => {
        params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
        return `(r.route_name LIKE ? OR r.start_point LIKE ? OR r.end_point LIKE ?)`;
      }).join(' OR ');
      
      searchConditions.push(`(${keywordConditions})`);
    }
    
    // Handle common abbreviations and variations
    const abbreviations = {
      'hitec': 'HITEC City',
      'hitech': 'HITEC City', 
      'hi-tech': 'HITEC City',
      'jh': 'Jubilee Hills',
      'jubilee': 'Jubilee Hills',
      'sec': 'Secunderabad',
      'secbad': 'Secunderabad',
      'ameerpet': 'Ameerpet',
      'gachi': 'Gachibowli',
      'madhapur': 'Madhapur',
      'kukatpally': 'Kukatpally',
      'begumpet': 'Begumpet'
    };
    
    // Add abbreviation matches
    Object.entries(abbreviations).forEach(([abbrev, full]) => {
      if (normalizedQuery.includes(abbrev)) {
        searchConditions.push(`(r.route_name LIKE ? OR r.start_point LIKE ? OR r.end_point LIKE ?)`);
        params.push(`%${full}%`, `%${full}%`, `%${full}%`);
      }
    });

    let distanceClause = '';
    if (lat && lng) {
      distanceClause = `
        AND (
          6371 * acos(
            cos(radians(?)) * cos(radians(t.current_lat)) * 
            cos(radians(t.current_lng) - radians(?)) + 
            sin(radians(?)) * sin(radians(t.current_lat))
          )
        ) <= ?
      `;
      params.push(parseFloat(lat), parseFloat(lng), parseFloat(lat), parseFloat(radius));
    }

    const sql = `
      SELECT 
        r.route_number,
        r.route_name,
        r.start_point,
        r.end_point,
        COUNT(t.id) as buses_count,
        AVG(t.current_lat) as center_lat,
        AVG(t.current_lng) as center_lng,
        MIN(
          CASE WHEN ? IS NOT NULL AND ? IS NOT NULL THEN
            6371 * acos(
              cos(radians(?)) * cos(radians(t.current_lat)) * 
              cos(radians(t.current_lng) - radians(?)) + 
              sin(radians(?)) * sin(radians(t.current_lat))
            )
          ELSE NULL END
        ) as distance,
        CASE 
          WHEN r.route_name LIKE ? THEN 1
          WHEN r.start_point LIKE ? OR r.end_point LIKE ? THEN 2
          ELSE 3
        END as relevance_score
      FROM transport_routes r
      LEFT JOIN live_tracking t ON r.id = t.route_id AND t.is_active = 1
      WHERE (${searchConditions.join(' OR ')})
        ${distanceClause}
      GROUP BY r.id, r.route_number, r.route_name
      HAVING buses_count > 0
      ORDER BY 
        relevance_score ASC,
        CASE WHEN ? IS NOT NULL THEN distance END ASC,
        buses_count DESC,
        r.route_name ASC
      LIMIT 10
    `;

    const searchParams = [
      lat, lng, lat, lng, lat, // For distance calculation in SELECT
      `%${query}%`, `%${query}%`, `%${query}%`, // For relevance scoring
      ...params, // All search conditions params
      lat // For ORDER BY distance
    ];

    db.all(sql, searchParams, (err, rows) => {
      if (err) {
        console.error('Error searching routes:', err);
        return res.status(500).json({ error: 'Search failed' });
      }

      const results = rows.map(row => ({
        display_name: row.route_name,
        subtitle: `Bus ${row.route_number} • ${row.start_point} → ${row.end_point}`,
        buses_count: row.buses_count,
        distance: row.distance,
        relevance_score: row.relevance_score,
        route_bounds: row.center_lat && row.center_lng ? {
          center_lat: row.center_lat,
          center_lng: row.center_lng
        } : null
      }));

      res.json({ results });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search by destination
app.get('/api/search/destination', async (req, res) => {
  try {
    const { query, lat, lng, radius = 5 } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'query parameter required' });
    }

    let distanceClause = '';
    let params = [`%${query}%`, `%${query}%`];
    
    if (lat && lng) {
      distanceClause = `
        AND (
          6371 * acos(
            cos(radians(?)) * cos(radians(s.latitude)) * 
            cos(radians(s.longitude) - radians(?)) + 
            sin(radians(?)) * sin(radians(s.latitude))
          )
        ) <= ?
      `;
      params.push(parseFloat(lat), parseFloat(lng), parseFloat(lat), parseFloat(radius));
    }

    const sql = `
      SELECT 
        s.stop_name,
        r.route_number,
        r.route_name,
        r.start_point,
        r.end_point,
        COUNT(t.id) as buses_count,
        s.latitude as stop_lat,
        s.longitude as stop_lng,
        MIN(
          CASE WHEN ? IS NOT NULL AND ? IS NOT NULL THEN
            6371 * acos(
              cos(radians(?)) * cos(radians(s.latitude)) * 
              cos(radians(s.longitude) - radians(?)) + 
              sin(radians(?)) * sin(radians(s.latitude))
            )
          ELSE NULL END
        ) as distance
      FROM transport_stops s
      JOIN transport_routes r ON s.route_id = r.id
      LEFT JOIN live_tracking t ON r.id = t.route_id AND t.is_active = 1
      WHERE (s.stop_name LIKE ? OR r.end_point LIKE ?)
        ${distanceClause}
      GROUP BY s.id, s.stop_name, r.route_number, r.route_name
      ORDER BY 
        CASE WHEN ? IS NOT NULL THEN distance END ASC,
        buses_count DESC,
        s.stop_name ASC
      LIMIT 10
    `;

    const searchParams = [
      lat, lng, lat, lng, lat, // For distance calculation in SELECT
      ...params, // Main query params
      lat // For ORDER BY distance
    ];

    db.all(sql, searchParams, (err, rows) => {
      if (err) {
        console.error('Error searching destinations:', err);
        return res.status(500).json({ error: 'Search failed' });
      }

      const results = rows.map(row => ({
        display_name: row.stop_name,
        subtitle: `Bus ${row.route_number} • ${row.route_name}`,
        buses_count: row.buses_count,
        distance: row.distance,
        route_bounds: {
          center_lat: row.stop_lat,
          center_lng: row.stop_lng
        }
      }));

      res.json({ results });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

initDB();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});