// 🧪 Test Data Seeding Script
// Seeds database with realistic users, locations, and transport data for E2E testing

const { db, initDB } = require('./database');
const bcrypt = require('bcrypt');

console.log('🌱 Starting test data seeding...');

// Sample Users for Testing
const testUsers = [
  {
    username: 'commuter_maya',
    email: 'maya@example.com',
    password: 'test123'
  },
  {
    username: 'student_alex',
    email: 'alex@university.edu',
    password: 'test123'
  },
  {
    username: 'senior_raj',
    email: 'raj@example.com',
    password: 'test123'
  },
  {
    username: 'tech_priya',
    email: 'priya@tech.com',
    password: 'test123'
  }
];

async function seedDatabase() {
  console.log('📝 Initializing database...');
  
  // Initialize the database with existing schema
  initDB();
  
  console.log('👥 Seeding test users...');
  
  for (const user of testUsers) {
    try {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await new Promise((resolve, reject) => {
        db.run(
          `INSERT OR REPLACE INTO users (id, username, email, password_hash)
           VALUES (?, ?, ?, ?)`,
          [userId, user.username, user.email, hashedPassword],
          function(err) {
            if (err) {
              console.error(`❌ Error creating user ${user.username}:`, err.message);
              reject(err);
            } else {
              console.log(`   ✅ Created user: ${user.username}`);
              resolve();
            }
          }
        );
      });
    } catch (error) {
      console.error(`❌ Failed to create user ${user.username}:`, error);
    }
  }
  
  // Add some sample rides and requests for testing
  console.log('🚗 Adding sample rides...');
  
  const sampleRides = [
    {
      rider_name: 'Maya',
      destination: 'Electronic City',
      current_lat: 12.9352,
      current_lng: 77.6192,
      destination_lat: 12.8456,
      destination_lng: 77.6603,
      status: 'active'
    },
    {
      rider_name: 'Priya',
      destination: 'Whitefield',
      current_lat: 12.9759,
      current_lng: 77.6055,
      destination_lat: 12.9891,
      destination_lng: 77.7417,
      status: 'active'
    }
  ];
  
  for (const ride of sampleRides) {
    try {
      const rideId = `ride_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO rides (id, rider_name, destination, current_lat, current_lng, destination_lat, destination_lng, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [rideId, ride.rider_name, ride.destination, ride.current_lat, ride.current_lng, 
           ride.destination_lat, ride.destination_lng, ride.status],
          function(err) {
            if (err) {
              console.error(`❌ Error creating ride for ${ride.rider_name}:`, err.message);
              reject(err);
            } else {
              console.log(`   ✅ Created ride: ${ride.rider_name} → ${ride.destination}`);
              resolve();
            }
          }
        );
      });
    } catch (error) {
      console.error(`❌ Failed to create ride for ${ride.rider_name}:`, error);
    }
  }
  
  console.log('🚌 Adding sample ride requests...');
  
  const sampleRequests = [
    {
      passenger_name: 'Alex',
      pickup_lat: 12.9891,
      pickup_lng: 77.7417,
      destination_lat: 12.9759,
      destination_lng: 77.6055,
      max_walk_distance: 500,
      status: 'pending'
    },
    {
      passenger_name: 'Raj',
      pickup_lat: 12.9767,
      pickup_lng: 77.5717,
      destination_lat: 12.9352,
      destination_lng: 77.6192,
      max_walk_distance: 300,
      status: 'pending'
    }
  ];
  
  for (const request of sampleRequests) {
    try {
      const requestId = `request_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO requests (id, passenger_name, pickup_lat, pickup_lng, destination_lat, destination_lng, max_walk_distance, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [requestId, request.passenger_name, request.pickup_lat, request.pickup_lng,
           request.destination_lat, request.destination_lng, request.max_walk_distance, request.status],
          function(err) {
            if (err) {
              console.error(`❌ Error creating request for ${request.passenger_name}:`, err.message);
              reject(err);
            } else {
              console.log(`   ✅ Created request: ${request.passenger_name}`);
              resolve();
            }
          }
        );
      });
    } catch (error) {
      console.error(`❌ Failed to create request for ${request.passenger_name}:`, error);
    }
  }
  
  // Get summary stats
  console.log('📈 Generating summary...');
  
  const userCount = await new Promise((resolve) => {
    db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
      resolve(row ? row.count : 0);
    });
  });
  
  const rideCount = await new Promise((resolve) => {
    db.get('SELECT COUNT(*) as count FROM rides', (err, row) => {
      resolve(row ? row.count : 0);
    });
  });
  
  const requestCount = await new Promise((resolve) => {
    db.get('SELECT COUNT(*) as count FROM requests', (err, row) => {
      resolve(row ? row.count : 0);
    });
  });
  
  console.log('\n🎉 Test data seeding completed successfully!');
  console.log('\n📊 Database Summary:');
  console.log(`   👥 Users: ${userCount}`);
  console.log(`   🚗 Rides: ${rideCount}`);
  console.log(`   🚌 Requests: ${requestCount}`);
  
  console.log('\n🔐 Test User Credentials:');
  console.log('   Username: commuter_maya | Password: test123');
  console.log('   Username: student_alex   | Password: test123');
  console.log('   Username: senior_raj     | Password: test123');
  console.log('   Username: tech_priya     | Password: test123');
  
  console.log('\n🧪 Ready for E2E testing!');
  
  // Close database connection
  db.close((err) => {
    if (err) {
      console.error('❌ Error closing database:', err.message);
    } else {
      console.log('✅ Database connection closed.');
    }
  });
}

// Run seeding
if (require.main === module) {
  seedDatabase().catch(error => {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  });
}

module.exports = { seedDatabase };