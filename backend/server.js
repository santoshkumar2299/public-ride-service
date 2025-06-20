require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const { db, initDB } = require('./database');
const { findMatches, createMatch } = require('./matching');

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

app.use(helmet());
app.use(cors({
  origin: FRONTEND_URL,
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

initDB();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});