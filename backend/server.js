require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
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

app.get('/api/rides', (req, res) => {
  db.all('SELECT * FROM rides WHERE status = "active"', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ rides: rows });
  });
});

app.post('/api/rides', (req, res) => {
  const { rider_name, destination, destination_lat, destination_lng, current_lat, current_lng } = req.body;
  
  if (!rider_name || !destination || !destination_lat || !destination_lng) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const id = uuidv4();
  const sql = `INSERT INTO rides (id, rider_name, destination, destination_lat, destination_lng, current_lat, current_lng) 
               VALUES (?, ?, ?, ?, ?, ?, ?)`;
  
  db.run(sql, [id, rider_name, destination, destination_lat, destination_lng, current_lat, current_lng], function(err) {
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
  const { passenger_name, pickup_lat, pickup_lng, destination_lat, destination_lng, max_walk_distance } = req.body;
  
  if (!passenger_name || !pickup_lat || !pickup_lng || !destination_lat || !destination_lng) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const id = uuidv4();
  const sql = `INSERT INTO requests (id, passenger_name, pickup_lat, pickup_lng, destination_lat, destination_lng, max_walk_distance) 
               VALUES (?, ?, ?, ?, ?, ?, ?)`;
  
  db.run(sql, [id, passenger_name, pickup_lat, pickup_lng, destination_lat, destination_lng, max_walk_distance || 1000], function(err) {
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

initDB();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});