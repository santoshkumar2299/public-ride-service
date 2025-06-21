const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = process.env.DATABASE_PATH ? 
  path.resolve(process.env.DATABASE_PATH) : 
  path.join(__dirname, 'rideshare.db');
const db = new sqlite3.Database(dbPath);

const initDB = () => {
  db.serialize(() => {
    // Users table for authentication (extended for social scoring)
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE,
      email TEXT UNIQUE,
      password_hash TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // EXISTING RIDE-SHARING TABLES (preserved)
    db.run(`CREATE TABLE IF NOT EXISTS rides (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      rider_name TEXT,
      destination TEXT,
      current_lat REAL,
      current_lng REAL,
      destination_lat REAL,
      destination_lng REAL,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS requests (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      passenger_name TEXT,
      pickup_lat REAL,
      pickup_lng REAL,
      destination_lat REAL,
      destination_lng REAL,
      max_walk_distance INTEGER,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS matches (
      id TEXT PRIMARY KEY,
      ride_id TEXT,
      request_id TEXT,
      meeting_lat REAL,
      meeting_lng REAL,
      status TEXT DEFAULT 'matched',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ride_id) REFERENCES rides (id),
      FOREIGN KEY (request_id) REFERENCES requests (id)
    )`);

    // NEW TRANSPORT INFRASTRUCTURE TABLES
    
    // Transport types (bus, train, metro, auto-rickshaw)
    db.run(`CREATE TABLE IF NOT EXISTS transport_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon TEXT NOT NULL,
      description TEXT,
      tracking_config TEXT, -- JSON config for tracking parameters
      prediction_model TEXT, -- JSON config for ML model
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Transport routes for each city and transport type
    db.run(`CREATE TABLE IF NOT EXISTS transport_routes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transport_type_id INTEGER,
      route_number TEXT NOT NULL,
      route_name TEXT NOT NULL,
      start_point TEXT NOT NULL,
      end_point TEXT NOT NULL,
      schedule_data TEXT, -- JSON with schedule information
      is_active BOOLEAN DEFAULT 1,
      city_id TEXT DEFAULT 'hyderabad',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (transport_type_id) REFERENCES transport_types (id)
    )`);

    // Transport stops along routes
    db.run(`CREATE TABLE IF NOT EXISTS transport_stops (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      route_id INTEGER,
      stop_name TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      stop_order INTEGER NOT NULL,
      estimated_time_minutes INTEGER,
      is_major_stop BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (route_id) REFERENCES transport_routes (id)
    )`);

    // Live tracking data from users
    db.run(`CREATE TABLE IF NOT EXISTS live_tracking (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      route_id INTEGER,
      current_lat REAL NOT NULL,
      current_lng REAL NOT NULL,
      speed REAL DEFAULT 0,
      direction REAL DEFAULT 0,
      confidence_score REAL DEFAULT 1.0,
      tracking_start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_update DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_active BOOLEAN DEFAULT 1,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (route_id) REFERENCES transport_routes (id)
    )`);

    // Social credibility scores
    db.run(`CREATE TABLE IF NOT EXISTS user_social_scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT UNIQUE,
      accuracy_score REAL DEFAULT 0,
      contribution_count INTEGER DEFAULT 0,
      verification_score REAL DEFAULT 0,
      reputation_level TEXT DEFAULT 'bronze',
      total_distance_tracked REAL DEFAULT 0,
      badges_earned TEXT, -- JSON array of badge IDs
      total_points INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )`);

    // Arrival predictions and their accuracy
    db.run(`CREATE TABLE IF NOT EXISTS arrival_predictions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      route_id INTEGER,
      stop_id INTEGER,
      predicted_arrival_time DATETIME NOT NULL,
      prediction_confidence REAL DEFAULT 0.5,
      algorithm_version TEXT DEFAULT 'v1.0',
      actual_arrival_time DATETIME,
      accuracy_percentage REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (route_id) REFERENCES transport_routes (id),
      FOREIGN KEY (stop_id) REFERENCES transport_stops (id)
    )`);

    // Community verification system
    db.run(`CREATE TABLE IF NOT EXISTS community_verifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tracker_user_id TEXT,
      verifier_user_id TEXT,
      route_id INTEGER,
      predicted_time DATETIME,
      actual_time DATETIME,
      verification_type TEXT DEFAULT 'arrival_time',
      accuracy_rating REAL,
      comments TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tracker_user_id) REFERENCES users (id),
      FOREIGN KEY (verifier_user_id) REFERENCES users (id),
      FOREIGN KEY (route_id) REFERENCES transport_routes (id)
    )`);

    // Bus spot reports (when users spot a bus at a location)
    db.run(`CREATE TABLE IF NOT EXISTS bus_spot_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      bus_number TEXT NOT NULL,
      route_id INTEGER,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      confidence_level TEXT DEFAULT 'medium', -- high, medium, low
      additional_info TEXT,
      photo_path TEXT, -- path to uploaded photo
      reported_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_verified INTEGER DEFAULT 0, -- 0=unverified, 1=verified, -1=false
      verification_count INTEGER DEFAULT 0,
      accuracy_score REAL DEFAULT 0.5,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (route_id) REFERENCES transport_routes (id)
    )`);

    // Bus report verifications (community verification of spot reports)
    db.run(`CREATE TABLE IF NOT EXISTS bus_report_verifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_id INTEGER NOT NULL,
      verifier_user_id TEXT NOT NULL,
      is_accurate INTEGER NOT NULL, -- 1=accurate, 0=inaccurate
      comments TEXT,
      verified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (report_id) REFERENCES bus_spot_reports (id),
      FOREIGN KEY (verifier_user_id) REFERENCES users (id)
    )`);

    // Indexes for better performance on location and time queries
    db.run(`CREATE INDEX IF NOT EXISTS idx_bus_spot_reports_location 
            ON bus_spot_reports (latitude, longitude)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_bus_spot_reports_time 
            ON bus_spot_reports (reported_at)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_bus_spot_reports_bus 
            ON bus_spot_reports (bus_number, route_id)`);

    // Initialize default transport types
    insertDefaultTransportTypes();
  });
};

const insertDefaultTransportTypes = () => {
  // First check if we already have transport types
  db.get('SELECT COUNT(*) as count FROM transport_types', (err, row) => {
    if (err) {
      console.error('Error checking transport types:', err);
      return;
    }
    
    if (row.count > 0) {
      // Transport types already exist, skip insertion
      return;
    }
    
    const defaultTypes = [
      {
        name: 'Bus',
        icon: '🚌',
        description: 'City and intercity bus services',
        tracking_config: JSON.stringify({
          gps_interval: 10,
          accuracy_threshold: 50,
          speed_threshold: 80
        }),
        prediction_model: JSON.stringify({
          type: 'time_distance',
          factors: ['traffic', 'time_of_day', 'weather']
        })
      },
      {
        name: 'Train',
        icon: '🚆',
        description: 'Railway and metro train services',
        tracking_config: JSON.stringify({
          gps_interval: 30,
          accuracy_threshold: 100,
          speed_threshold: 120
        }),
        prediction_model: JSON.stringify({
          type: 'schedule_based',
          factors: ['delays', 'congestion']
        })
      },
      {
        name: 'Metro',
        icon: '🚇',
        description: 'Urban metro rail systems',
        tracking_config: JSON.stringify({
          gps_interval: 15,
          accuracy_threshold: 25,
          speed_threshold: 80
        }),
        prediction_model: JSON.stringify({
          type: 'high_frequency',
          factors: ['peak_hours', 'incidents']
        })
      },
      {
        name: 'Auto-rickshaw',
        icon: '🛺',
        description: 'Three-wheeler auto-rickshaw services',
        tracking_config: JSON.stringify({
          gps_interval: 5,
          accuracy_threshold: 20,
          speed_threshold: 60
        }),
        prediction_model: JSON.stringify({
          type: 'on_demand',
          factors: ['traffic', 'availability', 'weather']
        })
      }
    ];

    defaultTypes.forEach(type => {
      db.run(`INSERT INTO transport_types (name, icon, description, tracking_config, prediction_model) 
              VALUES (?, ?, ?, ?, ?)`,
        [type.name, type.icon, type.description, type.tracking_config, type.prediction_model],
        function(err) {
          if (err) {
            console.log('Error inserting transport type:', err);
          }
        }
      );
    });
  });
};

module.exports = { db, initDB };