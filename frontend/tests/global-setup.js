// 🌱 Global Setup for Playwright Tests
// Seeds database with test data before running tests

import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function globalSetup() {
  console.log('🌱 Setting up test environment...');
  
  try {
    // Seed test database
    const seedScript = join(__dirname, '../../backend/seedTestData.js');
    console.log('📊 Seeding test database...');
    execSync(`node "${seedScript}"`, { stdio: 'inherit' });
    
    console.log('✅ Test environment setup complete!');
  } catch (error) {
    console.error('❌ Failed to setup test environment:', error);
    throw error;
  }
}

export default globalSetup;