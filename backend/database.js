const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = process.env.DATABASE_PATH ? 
  path.resolve(process.env.DATABASE_PATH) : 
  path.join(__dirname, 'rideshare.db');
const db = new sqlite3.Database(dbPath);

const initDB = () => {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS rides (
      id TEXT PRIMARY KEY,
      rider_name TEXT,
      destination TEXT,
      current_lat REAL,
      current_lng REAL,
      destination_lat REAL,
      destination_lng REAL,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS requests (
      id TEXT PRIMARY KEY,
      passenger_name TEXT,
      pickup_lat REAL,
      pickup_lng REAL,
      destination_lat REAL,
      destination_lng REAL,
      max_walk_distance INTEGER,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
  });
};

module.exports = { db, initDB };