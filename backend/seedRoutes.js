const { db } = require('./database');

// Sample Hyderabad bus routes for testing
const sampleRoutes = [
  {
    transport_type_id: 1, // Bus
    route_number: "185G",
    route_name: "Jubilee Hills - HITEC City",
    start_point: "Jubilee Hills Check Post",
    end_point: "HITEC City",
    city_id: "hyderabad",
    stops: [
      { stop_name: "Jubilee Hills Check Post", latitude: 17.4326, longitude: 78.4071, stop_order: 1, is_major_stop: 1 },
      { stop_name: "Road No. 36", latitude: 17.4290, longitude: 78.4094, stop_order: 2, estimated_time_minutes: 3 },
      { stop_name: "Film Nagar", latitude: 17.4263, longitude: 78.4102, stop_order: 3, estimated_time_minutes: 6 },
      { stop_name: "Shilparamam", latitude: 17.4186, longitude: 78.4087, stop_order: 4, estimated_time_minutes: 10 },
      { stop_name: "Hitech City Bus Stop", latitude: 17.4475, longitude: 78.3563, stop_order: 5, estimated_time_minutes: 25, is_major_stop: 1 }
    ]
  },
  {
    transport_type_id: 1, // Bus
    route_number: "216",
    route_name: "Secunderabad - Gachibowli",
    start_point: "Secunderabad Railway Station",
    end_point: "Gachibowli DLF",
    city_id: "hyderabad",
    stops: [
      { stop_name: "Secunderabad Railway Station", latitude: 17.4399, longitude: 78.5019, stop_order: 1, is_major_stop: 1 },
      { stop_name: "Paradise Circle", latitude: 17.4367, longitude: 78.4959, stop_order: 2, estimated_time_minutes: 5 },
      { stop_name: "Ameerpet Metro", latitude: 17.4375, longitude: 78.4483, stop_order: 3, estimated_time_minutes: 15, is_major_stop: 1 },
      { stop_name: "Punjagutta", latitude: 17.4239, longitude: 78.4528, stop_order: 4, estimated_time_minutes: 20 },
      { stop_name: "Banjara Hills", latitude: 17.4126, longitude: 78.4404, stop_order: 5, estimated_time_minutes: 25 },
      { stop_name: "Jubilee Hills", latitude: 17.4286, longitude: 78.4089, stop_order: 6, estimated_time_minutes: 30 },
      { stop_name: "Madhapur", latitude: 17.4485, longitude: 78.3908, stop_order: 7, estimated_time_minutes: 40 },
      { stop_name: "Gachibowli DLF", latitude: 17.4400, longitude: 78.3489, stop_order: 8, estimated_time_minutes: 50, is_major_stop: 1 }
    ]
  },
  {
    transport_type_id: 1, // Bus
    route_number: "102",
    route_name: "Charminar - Kukatpally",
    start_point: "Charminar",
    end_point: "Kukatpally Bus Stand",
    city_id: "hyderabad",
    stops: [
      { stop_name: "Charminar", latitude: 17.3616, longitude: 78.4747, stop_order: 1, is_major_stop: 1 },
      { stop_name: "High Court", latitude: 17.3753, longitude: 78.4784, stop_order: 2, estimated_time_minutes: 8 },
      { stop_name: "Nampally", latitude: 17.3850, longitude: 78.4867, stop_order: 3, estimated_time_minutes: 15 },
      { stop_name: "Lakdi Ka Pul", latitude: 17.3927, longitude: 78.4594, stop_order: 4, estimated_time_minutes: 20 },
      { stop_name: "Punjagutta", latitude: 17.4239, longitude: 78.4528, stop_order: 5, estimated_time_minutes: 30, is_major_stop: 1 },
      { stop_name: "Ameerpet", latitude: 17.4375, longitude: 78.4483, stop_order: 6, estimated_time_minutes: 35 },
      { stop_name: "SR Nagar", latitude: 17.4438, longitude: 78.4482, stop_order: 7, estimated_time_minutes: 40 },
      { stop_name: "ESI Hospital", latitude: 17.4686, longitude: 78.4561, stop_order: 8, estimated_time_minutes: 50 },
      { stop_name: "Kukatpally Bus Stand", latitude: 17.4840, longitude: 78.4194, stop_order: 9, estimated_time_minutes: 60, is_major_stop: 1 }
    ]
  },
  {
    transport_type_id: 1, // Bus
    route_number: "156V",
    route_name: "LB Nagar - Mehdipatnam",
    start_point: "LB Nagar X Roads",
    end_point: "Mehdipatnam",
    city_id: "hyderabad",
    stops: [
      { stop_name: "LB Nagar X Roads", latitude: 17.3421, longitude: 78.5527, stop_order: 1, is_major_stop: 1 },
      { stop_name: "Vanasthalipuram", latitude: 17.3239, longitude: 78.5283, stop_order: 2, estimated_time_minutes: 8 },
      { stop_name: "Dilsukhnagar", latitude: 17.3687, longitude: 78.5248, stop_order: 3, estimated_time_minutes: 15, is_major_stop: 1 },
      { stop_name: "Koti", latitude: 17.3753, longitude: 78.4823, stop_order: 4, estimated_time_minutes: 25 },
      { stop_name: "Abids", latitude: 17.3936, longitude: 78.4831, stop_order: 5, estimated_time_minutes: 30 },
      { stop_name: "Lakdi Ka Pul", latitude: 17.3927, longitude: 78.4594, stop_order: 6, estimated_time_minutes: 35 },
      { stop_name: "Mehdipatnam", latitude: 17.3969, longitude: 78.4364, stop_order: 7, estimated_time_minutes: 45, is_major_stop: 1 }
    ]
  },
  {
    transport_type_id: 3, // Metro
    route_number: "BLUE",
    route_name: "Nagole - Raidurg (Blue Line)",
    start_point: "Nagole Metro Station",
    end_point: "Raidurg Metro Station",
    city_id: "hyderabad",
    stops: [
      { stop_name: "Nagole", latitude: 17.3570, longitude: 78.5514, stop_order: 1, is_major_stop: 1 },
      { stop_name: "Uppal", latitude: 17.4067, longitude: 78.5526, stop_order: 2, estimated_time_minutes: 4 },
      { stop_name: "Stadium", latitude: 17.4067, longitude: 78.5283, stop_order: 3, estimated_time_minutes: 8 },
      { stop_name: "NGRI", latitude: 17.4067, longitude: 78.5121, stop_order: 4, estimated_time_minutes: 11 },
      { stop_name: "Habsiguda", latitude: 17.4067, longitude: 78.4959, stop_order: 5, estimated_time_minutes: 14 },
      { stop_name: "Tarnaka", latitude: 17.4158, longitude: 78.4797, stop_order: 6, estimated_time_minutes: 17 },
      { stop_name: "Mettuguda", latitude: 17.4279, longitude: 78.4635, stop_order: 7, estimated_time_minutes: 20 },
      { stop_name: "Secunderabad East", latitude: 17.4399, longitude: 78.4635, stop_order: 8, estimated_time_minutes: 23 },
      { stop_name: "Parade Ground", latitude: 17.4437, longitude: 78.4716, stop_order: 9, estimated_time_minutes: 26 },
      { stop_name: "Secunderabad West", latitude: 17.4437, longitude: 78.4878, stop_order: 10, estimated_time_minutes: 29 },
      { stop_name: "Gandhi Hospital", latitude: 17.4437, longitude: 78.5040, stop_order: 11, estimated_time_minutes: 32 },
      { stop_name: "Musheerabad", latitude: 17.4437, longitude: 78.5202, stop_order: 12, estimated_time_minutes: 35 },
      { stop_name: "RTC X Roads", latitude: 17.4316, longitude: 78.5040, stop_order: 13, estimated_time_minutes: 38 },
      { stop_name: "Chikkadpally", latitude: 17.4195, longitude: 78.4878, stop_order: 14, estimated_time_minutes: 41 },
      { stop_name: "Narayanguda", latitude: 17.4074, longitude: 78.4716, stop_order: 15, estimated_time_minutes: 44 },
      { stop_name: "Sultan Bazar", latitude: 17.3953, longitude: 78.4635, stop_order: 16, estimated_time_minutes: 47 },
      { stop_name: "MG Bus Station", latitude: 17.3831, longitude: 78.4554, stop_order: 17, estimated_time_minutes: 50 },
      { stop_name: "Malakpet", latitude: 17.3710, longitude: 78.4473, stop_order: 18, estimated_time_minutes: 53 },
      { stop_name: "New Market", latitude: 17.3589, longitude: 78.4392, stop_order: 19, estimated_time_minutes: 56 },
      { stop_name: "Musarambagh", latitude: 17.3468, longitude: 78.4311, stop_order: 20, estimated_time_minutes: 59 },
      { stop_name: "Dilsukhnagar", latitude: 17.3687, longitude: 78.5248, stop_order: 21, estimated_time_minutes: 62, is_major_stop: 1 },
      { stop_name: "Chaitanyapuri", latitude: 17.3806, longitude: 78.5329, stop_order: 22, estimated_time_minutes: 65 },
      { stop_name: "Victoria Memorial", latitude: 17.3925, longitude: 78.5410, stop_order: 23, estimated_time_minutes: 68 },
      { stop_name: "L B Nagar", latitude: 17.3421, longitude: 78.5527, stop_order: 24, estimated_time_minutes: 71, is_major_stop: 1 },
      { stop_name: "Kothaguda", latitude: 17.4440, longitude: 78.3698, stop_order: 25, estimated_time_minutes: 74 },
      { stop_name: "Hitech City", latitude: 17.4475, longitude: 78.3563, stop_order: 26, estimated_time_minutes: 77, is_major_stop: 1 },
      { stop_name: "Raidurg", latitude: 17.4353, longitude: 78.3428, stop_order: 27, estimated_time_minutes: 80, is_major_stop: 1 }
    ]
  }
];

async function seedRoutes() {
  console.log('Starting to seed routes...');
  
  try {
    for (const routeData of sampleRoutes) {
      // Create the route
      const route = await new Promise((resolve, reject) => {
        const { stops, ...routeInfo } = routeData;
        
        db.run(`
          INSERT INTO transport_routes 
          (transport_type_id, route_number, route_name, start_point, end_point, city_id)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [routeInfo.transport_type_id, routeInfo.route_number, routeInfo.route_name, 
            routeInfo.start_point, routeInfo.end_point, routeInfo.city_id], 
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, ...routeInfo });
        });
      });

      console.log(`Created route: ${route.route_number} - ${route.route_name}`);

      // Add stops for this route
      for (const stop of routeData.stops) {
        await new Promise((resolve, reject) => {
          db.run(`
            INSERT INTO transport_stops 
            (route_id, stop_name, latitude, longitude, stop_order, estimated_time_minutes, is_major_stop)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `, [route.id, stop.stop_name, stop.latitude, stop.longitude, 
              stop.stop_order, stop.estimated_time_minutes || null, stop.is_major_stop || 0],
          function(err) {
            if (err) reject(err);
            else resolve({ id: this.lastID, route_id: route.id, ...stop });
          });
        });
      }

      console.log(`  Added ${routeData.stops.length} stops`);
    }

    console.log('\n✅ Routes seeding completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   • ${sampleRoutes.length} routes created`);
    console.log(`   • ${sampleRoutes.reduce((sum, route) => sum + route.stops.length, 0)} stops created`);
    console.log(`   • Cities: ${Array.from(new Set(sampleRoutes.map(r => r.city_id))).join(', ')}`);
    
  } catch (error) {
    console.error('❌ Error seeding routes:', error);
    throw error;
  }
}

// Check if routes already exist
async function checkExistingRoutes() {
  return new Promise((resolve, reject) => {
    db.get('SELECT COUNT(*) as count FROM transport_routes', (err, row) => {
      if (err) reject(err);
      else resolve(row.count);
    });
  });
}

async function main() {
  try {
    const existingCount = await checkExistingRoutes();
    
    if (existingCount > 0) {
      console.log(`⚠️  Found ${existingCount} existing routes. Skipping seed to avoid duplicates.`);
      console.log('   To force re-seed, delete existing routes first or clear the database.');
      return;
    }

    await seedRoutes();
    
  } catch (error) {
    console.error('Failed to seed routes:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().then(() => {
    console.log('\n🚀 Seed script completed');
    process.exit(0);
  });
}

module.exports = { seedRoutes, sampleRoutes };