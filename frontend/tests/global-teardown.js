// 🧹 Global Teardown for Playwright Tests
// Cleanup after test completion

async function globalTeardown() {
  console.log('🧹 Cleaning up test environment...');
  
  try {
    // Add any cleanup logic here if needed
    // For now, we keep the test data for debugging
    
    console.log('✅ Test environment cleanup complete!');
  } catch (error) {
    console.error('❌ Failed to cleanup test environment:', error);
    // Don't throw error in teardown to avoid masking test failures
  }
}

export default globalTeardown;