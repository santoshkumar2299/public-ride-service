const { db } = require('./database');

async function cleanupDuplicates() {
  console.log('Cleaning up duplicate transport types...');
  
  // First get the earliest entry for each transport type
  const uniqueTypes = await new Promise((resolve, reject) => {
    db.all(`
      SELECT MIN(id) as id, name 
      FROM transport_types 
      GROUP BY name
    `, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
  
  console.log('Unique transport types found:', uniqueTypes);
  
  // Delete all except the earliest ones
  for (const type of uniqueTypes) {
    await new Promise((resolve, reject) => {
      db.run(`
        DELETE FROM transport_types 
        WHERE name = ? AND id \!= ?
      `, [type.name, type.id], function(err) {
        if (err) reject(err);
        else {
          console.log(`Cleaned up ${this.changes} duplicates for ${type.name}`);
          resolve();
        }
      });
    });
  }
  
  // Verify cleanup
  const finalCount = await new Promise((resolve, reject) => {
    db.get('SELECT COUNT(*) as count FROM transport_types', (err, row) => {
      if (err) reject(err);
      else resolve(row.count);
    });
  });
  
  console.log(`✅ Cleanup complete. Final count: ${finalCount} transport types`);
}

cleanupDuplicates().then(() => {
  console.log('🎉 Database cleanup successful');
  process.exit(0);
}).catch(err => {
  console.error('❌ Cleanup failed:', err);
  process.exit(1);
});
