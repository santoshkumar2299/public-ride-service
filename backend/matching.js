const { db } = require('./database');

function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c * 1000;
}

function calculateBearing(lat1, lng1, lat2, lng2) {
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const y = Math.sin(dLng) * Math.cos(lat2 * Math.PI / 180);
  const x = Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180) -
            Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos(dLng);
  let bearing = Math.atan2(y, x) * 180 / Math.PI;
  return (bearing + 360) % 360;
}

function findMatches(passengerId, callback) {
  db.get('SELECT * FROM requests WHERE id = ?', [passengerId], (err, request) => {
    if (err || !request) {
      return callback(err || new Error('Request not found'), null);
    }

    db.all('SELECT * FROM rides WHERE status = "active"', (err, rides) => {
      if (err) {
        return callback(err, null);
      }

      const matches = [];
      const passengerBearing = calculateBearing(
        request.pickup_lat, request.pickup_lng,
        request.destination_lat, request.destination_lng
      );

      for (const ride of rides) {
        if (!ride.current_lat || !ride.current_lng) continue;

        const riderBearing = calculateBearing(
          ride.current_lat, ride.current_lng,
          ride.destination_lat, ride.destination_lng
        );

        let bearingDiff = Math.abs(passengerBearing - riderBearing);
        if (bearingDiff > 180) {
          bearingDiff = 360 - bearingDiff;
        }

        if (bearingDiff > 45) continue;

        const pickupDistance = calculateDistance(
          request.pickup_lat, request.pickup_lng,
          ride.current_lat, ride.current_lng
        );

        if (pickupDistance <= (request.max_walk_distance || 1000)) {
          matches.push({
            ride,
            distance: pickupDistance,
            bearing_similarity: 100 - (bearingDiff / 45 * 100),
            meeting_point: {
              lat: ride.current_lat,
              lng: ride.current_lng
            }
          });
        }
      }

      matches.sort((a, b) => {
        const scoreA = a.bearing_similarity - (a.distance / 10);
        const scoreB = b.bearing_similarity - (b.distance / 10);
        return scoreB - scoreA;
      });

      callback(null, matches);
    });
  });
}

function createMatch(rideId, requestId, meetingLat, meetingLng, callback) {
  const { v4: uuidv4 } = require('uuid');
  const id = uuidv4();
  
  const sql = `INSERT INTO matches (id, ride_id, request_id, meeting_lat, meeting_lng) 
               VALUES (?, ?, ?, ?, ?)`;
  
  db.run(sql, [id, rideId, requestId, meetingLat, meetingLng], function(err) {
    if (err) {
      return callback(err, null);
    }
    
    db.run('UPDATE requests SET status = "matched" WHERE id = ?', [requestId]);
    
    callback(null, { id, ride_id: rideId, request_id: requestId });
  });
}

module.exports = { findMatches, createMatch, calculateDistance, calculateBearing };