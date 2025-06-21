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

initDB();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});